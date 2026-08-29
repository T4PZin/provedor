using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Core.Attributes;
using CounterStrikeSharp.API.Modules.Memory;
using CounterStrikeSharp.API.Modules.Memory.DynamicFunctions;
using Microsoft.Extensions.Logging;
using System.Runtime.CompilerServices;

[assembly: InternalsVisibleTo("InventoryChanger.Tests")]

namespace InventoryChanger;

[MinimumApiVersion(300)]
public sealed class InventoryChangerPlugin : BasePlugin
{
    public override string ModuleName => "FRAGHOST Inventory Changer";
    public override string ModuleVersion => "1.0.0";
    public override string ModuleAuthor => "FRAGHOST";
    public override string ModuleDescription => "Skins, facas, luvas e agentes personalizados por jogador (comandos: !skins !knife !gloves !agents !wsreset).";

    internal Catalog Catalog { get; private set; } = null!;
    internal LoadoutStore Store { get; private set; } = null!;
    internal SkinApplier Applier { get; private set; } = null!;

    public override void Load(bool hotReload)
    {
        var dataDir = Path.Combine(ModuleDirectory, "data");
        Directory.CreateDirectory(dataDir);

        Catalog = Catalog.Load(Path.Combine(dataDir, "skins.json"));
        Store = new LoadoutStore(Path.Combine(dataDir, "loadouts.json"), msg => Logger.LogInformation("{msg}", msg));
        Applier = new SkinApplier(this);

        RegisterEventHandler<EventPlayerSpawn>(OnPlayerSpawn);
        RegisterEventHandler<EventPlayerDeath>(OnPlayerDeath);
        RegisterEventHandler<EventPlayerDisconnect>(OnPlayerDisconnect);
        RegisterListener<Listeners.OnEntitySpawned>(OnEntitySpawned);
        RegisterListener<Listeners.OnMapStart>(_ =>
        {
            foreach (var agent in Catalog.Agents)
                Server.PrecacheModel($"agents/models/{agent.Model}.vmdl");
        });

        VirtualFunctions.GiveNamedItemFunc.Hook(OnGiveNamedItemPost, HookMode.Post);

        PluginCommands.Register(this);

        Logger.LogInformation("InventoryChanger carregado: {w} armas, {k} facas, {g} luvas, {a} agentes no catalogo.",
            Catalog.Weapons.Count, Catalog.Knives.Count, Catalog.Gloves.Count, Catalog.Agents.Count);
    }

    public override void Unload(bool hotReload)
    {
        VirtualFunctions.GiveNamedItemFunc.Unhook(OnGiveNamedItemPost, HookMode.Post);
        Store.Dispose();
    }

    // ---- spawn: luvas + agente (a faca e convertida no hook do GiveNamedItem) ----

    private HookResult OnPlayerSpawn(EventPlayerSpawn e, GameEventInfo info)
    {
        var player = e.Userid;
        if (player is null || !player.IsValid || player.IsBot) return HookResult.Continue;
        if (Store.Get(player.SteamID) is null) return HookResult.Continue;

        Applier.ApplyAgent(player);
        Server.NextFrame(() => Applier.ApplyGloves(player));
        return HookResult.Continue;
    }

    // ---- aplicacao de skins quando o servidor entrega uma arma ao jogador ----

    private HookResult OnGiveNamedItemPost(DynamicHook hook)
    {
        try
        {
            var weapon = hook.GetReturn<CBasePlayerWeapon>();
            if (weapon is null || !weapon.IsValid) return HookResult.Continue;
            if (string.IsNullOrEmpty(weapon.DesignerName) || !weapon.DesignerName.Contains("weapon"))
                return HookResult.Continue;

            var itemServices = hook.GetParam<CCSPlayer_ItemServices>(0);
            var player = GetPlayerFromItemServices(itemServices);
            if (player is null) return HookResult.Continue;

            ApplyToWeapon(player, weapon);
        }
        catch (Exception ex)
        {
            Logger.LogWarning("Falha ao aplicar skin: {msg}", ex.Message);
        }
        return HookResult.Continue;
    }

    // armas que aparecem no mundo (drops) com dono conhecido
    private void OnEntitySpawned(CEntityInstance entity)
    {
        if (!entity.DesignerName.Contains("weapon")) return;

        Server.NextWorldUpdate(() =>
        {
            var weapon = new CBasePlayerWeapon(entity.Handle);
            if (!weapon.IsValid || weapon.OriginalOwnerXuidLow <= 0) return;

            var player = Utilities.GetPlayerFromSteamId(weapon.OriginalOwnerXuidLow);
            if (player is null || !player.IsValid || player.IsBot) return;

            ApplyToWeapon(player, weapon);
        });
    }

    internal void ApplyToWeapon(CCSPlayerController player, CBasePlayerWeapon weapon)
    {
        var loadout = Store.Get(player.SteamID);
        if (loadout is null) return;

        var designer = weapon.DesignerName;

        if (SkinApplier.IsKnifeName(designer))
        {
            if (loadout.Knife is { } knife && knife.PaintKit > 0)
                Applier.ApplyWeapon(player, weapon, knife, isKnife: true, knifeDefIndex: knife.DefIndex);
            return;
        }

        if (loadout.Weapons.TryGetValue(designer, out var pick))
            Applier.ApplyWeapon(player, weapon, pick, isKnife: false);
    }

    // ---- StatTrak: contagem de kills ao vivo ----

    private HookResult OnPlayerDeath(EventPlayerDeath e, GameEventInfo info)
    {
        var attacker = e.Attacker;
        var victim = e.Userid;
        if (attacker is null || !attacker.IsValid || attacker.IsBot) return HookResult.Continue;
        if (victim is null || !victim.IsValid || victim == attacker) return HookResult.Continue;

        var loadout = Store.Get(attacker.SteamID);
        if (loadout is null) return HookResult.Continue;

        var weapon = attacker.PlayerPawn.Value?.WeaponServices?.ActiveWeapon.Value;
        if (weapon is null || !weapon.IsValid) return HookResult.Continue;

        var designer = weapon.DesignerName;
        WeaponPick? pick = SkinApplier.IsKnifeName(designer)
            ? loadout.Knife
            : loadout.Weapons.GetValueOrDefault(designer);

        if (pick is null || !pick.StatTrak) return HookResult.Continue;

        pick.StatTrakKills++;
        Applier.UpdateKillEater(weapon, pick.StatTrakKills);
        return HookResult.Continue;
    }

    private HookResult OnPlayerDisconnect(EventPlayerDisconnect e, GameEventInfo info)
    {
        var player = e.Userid;
        if (player is null || player.IsBot) return HookResult.Continue;
        if (Store.Get(player.SteamID) is not null) Store.Save(); // persiste StatTrakKills
        return HookResult.Continue;
    }

    private static CCSPlayerController? GetPlayerFromItemServices(CCSPlayer_ItemServices itemServices)
    {
        var pawn = itemServices.Pawn.Value?.As<CCSPlayerPawn>();
        if (pawn is null || !pawn.IsValid) return null;
        var controller = pawn.OriginalController.Value;
        return controller is { IsValid: true, IsBot: false } ? controller : null;
    }
}
