using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Modules.Memory.DynamicFunctions;

namespace InventoryChanger;

/// <summary>
/// Aplica os atributos "econ" (paint kit, wear, seed, stattrak, nametag) nas
/// entidades de arma/luvas, seguindo o mesmo mecanismo do cs2-WeaponPaints:
/// funcao nativa CAttributeList::SetOrAddAttributeValueByName (via gamedata)
/// + FallbackPaintKit/Seed/Wear da entidade.
/// </summary>
public sealed class SkinApplier(InventoryChangerPlugin plugin)
{
    private static readonly MemoryFunctionVoid<nint, string, float> SetAttr = new(
        GameData.GetSignature("CAttributeList_SetOrAddAttributeValueByName"));

    private const ulong MinCustomItemId = 65578;
    private ulong _nextItemId = MinCustomItemId;

    private ulong NextItemId() => _nextItemId++;

    /// <summary>Aplica a skin (e faca, quando for o caso) numa entidade de arma do jogador.</summary>
    public void ApplyWeapon(CCSPlayerController player, CBasePlayerWeapon weapon, WeaponPick pick, bool isKnife, int knifeDefIndex = 0)
    {
        var item = weapon.AttributeManager.Item;

        if (isKnife && knifeDefIndex > 0)
        {
            if (item.ItemDefinitionIndex != (ushort)knifeDefIndex)
                weapon.AcceptInput("ChangeSubclass", value: knifeDefIndex.ToString());

            item.ItemDefinitionIndex = (ushort)knifeDefIndex;
            item.EntityQuality = 3;
        }
        else
        {
            item.EntityQuality = pick.StatTrak ? 9 : 0;
        }

        item.AccountID = (uint)player.SteamID;
        item.ItemID = NextItemId();

        if (pick.PaintKit <= 0) return;

        weapon.FallbackPaintKit = pick.PaintKit;
        weapon.FallbackSeed = pick.Seed;
        weapon.FallbackWear = pick.Wear;

        if (!string.IsNullOrWhiteSpace(pick.NameTag))
            item.CustomName = pick.NameTag;

        SetTextureAttrs(item.AttributeList, pick.PaintKit, pick.Seed, pick.Wear);
        SetTextureAttrs(item.NetworkedDynamicAttributes, pick.PaintKit, pick.Seed, pick.Wear);

        if (pick.StatTrak)
        {
            SetKillEater(item.AttributeList, (uint)pick.StatTrakKills);
            SetKillEater(item.NetworkedDynamicAttributes, (uint)pick.StatTrakKills);
        }
    }

    /// <summary>Atualiza o contador StatTrak ao vivo (apos uma kill).</summary>
    public void UpdateKillEater(CBasePlayerWeapon weapon, int kills)
    {
        var item = weapon.AttributeManager.Item;
        SetKillEater(item.AttributeList, (uint)kills);
        SetKillEater(item.NetworkedDynamicAttributes, (uint)kills);
    }

    /// <summary>Aplica as luvas no spawn (com o ritual de refresh do modelo).</summary>
    public void ApplyGloves(CCSPlayerController player)
    {
        if (!player.IsValid || !player.PawnIsAlive) return;
        var pawn = player.PlayerPawn.Value;
        if (pawn is null || !pawn.IsValid) return;

        var item = pawn.EconGloves;
        item.NetworkedDynamicAttributes.Attributes.RemoveAll();
        item.AttributeList.Attributes.RemoveAll();

        // forca refresh do modelo para nao sobrepor luvas antigas
        player.ExecuteClientCommand("lastinv");

        plugin.AddTimer(0.08f, () =>
        {
            if (!player.IsValid || !player.PawnIsAlive) return;
            var loadout = plugin.Store.Get(player.SteamID);
            if (loadout?.Gloves is not { } gloves) return;

            item.ItemDefinitionIndex = (ushort)gloves.DefIndex;
            item.ItemID = NextItemId();

            SetTextureAttrs(item.NetworkedDynamicAttributes, gloves.PaintKit, gloves.Seed, gloves.Wear);
            SetTextureAttrs(item.AttributeList, gloves.PaintKit, gloves.Seed, gloves.Wear);

            item.Initialized = true;

            player.ExecuteClientCommand("lastinv");
            pawn.AcceptInput("SetBodygroup", value: "first_or_third_person,0");
            plugin.AddTimer(0.2f,
                () => pawn.AcceptInput("SetBodygroup", value: "first_or_third_person,1"),
                CounterStrikeSharp.API.Modules.Timers.TimerFlags.STOP_ON_MAPCHANGE);
        }, CounterStrikeSharp.API.Modules.Timers.TimerFlags.STOP_ON_MAPCHANGE);
    }

    /// <summary>Aplica o agente (modelo do jogador) respeitando o time do agente.</summary>
    public void ApplyAgent(CCSPlayerController player)
    {
        var loadout = plugin.Store.Get(player.SteamID);
        if (string.IsNullOrEmpty(loadout?.Agent)) return;

        var agent = plugin.Catalog.FindAgent(loadout.Agent);
        if (agent is null) return;
        if ((agent.Team == 2 || agent.Team == 3) && player.TeamNum != agent.Team) return;

        var pawn = player.PlayerPawn.Value;
        if (pawn is null || !pawn.IsValid) return;

        Server.NextFrame(() => pawn.SetModel($"agents/models/{agent.Model}.vmdl"));
    }

    /// <summary>Troca a faca em maos pela escolhida no menu (mata a entidade atual e da a nova).</summary>
    public void EquipKnife(CCSPlayerController player, KnifePick knife)
    {
        var weaponServices = player.PlayerPawn.Value?.WeaponServices;
        if (weaponServices?.MyWeapons is null) return;

        foreach (var handle in weaponServices.MyWeapons)
        {
            var entity = handle.Value;
            if (entity is { IsValid: true } && IsKnifeName(entity.DesignerName))
                entity.AddEntityIOEvent("Kill", entity, null, "", 0f);
        }

        player.GiveNamedItem(knife.Id);
        Utilities.SetStateChanged(player, "CCSPlayerController", "m_pInventoryServices");
    }

    public static bool IsKnifeName(string designerName) =>
        designerName.Contains("knife") || designerName.Contains("bayonet");

    private static void SetTextureAttrs(CAttributeList list, int paintKit, int seed, float wear)
    {
        list.Attributes.RemoveAll();
        SetAttr.Invoke(list.Handle, "set item texture prefab", paintKit);
        SetAttr.Invoke(list.Handle, "set item texture seed", seed);
        SetAttr.Invoke(list.Handle, "set item texture wear", wear);
    }

    private static void SetKillEater(CAttributeList list, uint kills)
    {
        SetAttr.Invoke(list.Handle, "kill eater", BitConverter.UInt32BitsToSingle(kills));
        SetAttr.Invoke(list.Handle, "kill eater score type", 0f);
    }
}
