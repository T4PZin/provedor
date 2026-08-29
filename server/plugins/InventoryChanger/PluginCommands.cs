using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Modules.Menu;

namespace InventoryChanger;

/// <summary>Comandos de chat (!skins, !knife, !gloves, !agents, !wsreset) com menus numerados.</summary>
public static class PluginCommands
{
    private const string Tag = " \x06[FRAGHOST]\x01 ";

    public static void Register(InventoryChangerPlugin plugin)
    {
        plugin.AddCommand("css_skins", "Escolher skins de armas", (player, _) =>
        {
            if (player is not null) WeaponMenu(plugin, player);
        });

        plugin.AddCommand("css_knife", "Escolher faca", (player, _) =>
        {
            if (player is not null) KnifeMenu(plugin, player);
        });

        plugin.AddCommand("css_gloves", "Escolher luvas", (player, _) =>
        {
            if (player is not null) GloveMenu(plugin, player);
        });

        plugin.AddCommand("css_agents", "Escolher agente", (player, _) =>
        {
            if (player is not null) AgentMenu(plugin, player);
        });

        plugin.AddCommand("css_wsreset", "Voltar ao inventario padrao", (player, _) =>
        {
            if (player is null) return;
            plugin.Store.Reset(player.SteamID);
            player.PrintToChat(Tag + "Inventario personalizado removido.");
        });
    }

    private static void WeaponMenu(InventoryChangerPlugin plugin, CCSPlayerController player)
    {
        var menu = new ChatMenu("Skins de armas");
        foreach (var entry in plugin.Catalog.Weapons)
        {
            var weapon = entry;
            menu.AddMenuOption(weapon.Name, (p, _) => PaintMenu(plugin, p, weapon.Name, weapon.Paints, paint =>
            {
                var loadout = plugin.Store.GetOrCreate(p.SteamID, p.PlayerName);
                loadout.Weapons[weapon.Id] = new WeaponPick { PaintKit = paint.Id, Wear = 0.01f };
                plugin.Store.Save();
                ReapplyHeldWeapon(plugin, p, weapon.Id);
                p.PrintToChat($"{Tag}{weapon.Name} | {paint.Name} aplicada. Ajuste wear/StatTrak no painel de PC.");
            }));
        }
        MenuManager.OpenChatMenu(player, menu);
    }

    private static void KnifeMenu(InventoryChangerPlugin plugin, CCSPlayerController player)
    {
        var menu = new ChatMenu("Facas");
        menu.AddMenuOption("Faca padrao", (p, _) =>
        {
            var loadout = plugin.Store.GetOrCreate(p.SteamID, p.PlayerName);
            loadout.Knife = null;
            plugin.Store.Save();
            p.PrintToChat(Tag + "Faca padrao restaurada no proximo spawn.");
        });

        foreach (var entry in plugin.Catalog.Knives)
        {
            var knife = entry;
            menu.AddMenuOption(knife.Name, (p, _) => PaintMenu(plugin, p, knife.Name, knife.Paints, paint =>
            {
                var loadout = plugin.Store.GetOrCreate(p.SteamID, p.PlayerName);
                loadout.Knife = new KnifePick { Id = knife.Id, DefIndex = knife.DefIndex, PaintKit = paint.Id, Wear = 0.01f };
                plugin.Store.Save();
                plugin.Applier.EquipKnife(p, loadout.Knife);
                p.PrintToChat($"{Tag}{knife.Name} | {paint.Name} equipada.");
            }));
        }
        MenuManager.OpenChatMenu(player, menu);
    }

    private static void GloveMenu(InventoryChangerPlugin plugin, CCSPlayerController player)
    {
        var menu = new ChatMenu("Luvas");
        menu.AddMenuOption("Sem luvas", (p, _) =>
        {
            var loadout = plugin.Store.GetOrCreate(p.SteamID, p.PlayerName);
            loadout.Gloves = null;
            plugin.Store.Save();
            p.PrintToChat(Tag + "Luvas removidas no proximo spawn.");
        });

        foreach (var entry in plugin.Catalog.Gloves)
        {
            var glove = entry;
            menu.AddMenuOption(glove.Name, (p, _) => PaintMenu(plugin, p, glove.Name, glove.Paints, paint =>
            {
                var loadout = plugin.Store.GetOrCreate(p.SteamID, p.PlayerName);
                loadout.Gloves = new GlovePick { DefIndex = glove.DefIndex, PaintKit = paint.Id, Wear = 0.25f };
                plugin.Store.Save();
                plugin.Applier.ApplyGloves(p);
                p.PrintToChat($"{Tag}{glove.Name} | {paint.Name} equipadas.");
            }));
        }
        MenuManager.OpenChatMenu(player, menu);
    }

    private static void AgentMenu(InventoryChangerPlugin plugin, CCSPlayerController player)
    {
        var menu = new ChatMenu("Agentes");
        menu.AddMenuOption("Agente padrao", (p, _) =>
        {
            var loadout = plugin.Store.GetOrCreate(p.SteamID, p.PlayerName);
            loadout.Agent = "";
            plugin.Store.Save();
            p.PrintToChat(Tag + "Agente padrao no proximo spawn.");
        });

        foreach (var agent in plugin.Catalog.Agents)
        {
            var selected = agent;
            menu.AddMenuOption(selected.Name, (p, _) =>
            {
                var loadout = plugin.Store.GetOrCreate(p.SteamID, p.PlayerName);
                loadout.Agent = selected.Id;
                plugin.Store.Save();
                plugin.Applier.ApplyAgent(p);
                p.PrintToChat($"{Tag}Agente {selected.Name} aplicado.");
            });
        }
        MenuManager.OpenChatMenu(player, menu);
    }

    private static void PaintMenu(InventoryChangerPlugin plugin, CCSPlayerController player, string title,
        List<PaintEntry> paints, Action<PaintEntry> onPick)
    {
        var menu = new ChatMenu(title);
        foreach (var paint in paints)
        {
            var selected = paint;
            menu.AddMenuOption(selected.Name, (p, _) => onPick(selected));
        }
        MenuManager.OpenChatMenu(player, menu);
    }

    private static void ReapplyHeldWeapon(InventoryChangerPlugin plugin, CCSPlayerController player, string designerName)
    {
        var weaponServices = player.PlayerPawn.Value?.WeaponServices;
        if (weaponServices?.MyWeapons is null) return;

        foreach (var handle in weaponServices.MyWeapons)
        {
            var weapon = handle.Value;
            if (weapon is { IsValid: true } && weapon.DesignerName == designerName)
            {
                plugin.ApplyToWeapon(player, weapon);
                return;
            }
        }
    }
}
