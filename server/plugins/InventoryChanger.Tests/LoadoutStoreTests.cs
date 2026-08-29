using System.Text.Json;
using InventoryChanger;
using Xunit;

namespace InventoryChanger.Tests;

public class LoadoutStoreTests
{
    private static string NewFile()
    {
        var dir = Path.Combine(Path.GetTempPath(), "ic_test_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(dir);
        return Path.Combine(dir, "loadouts.json");
    }

    [Fact]
    public void Save_preserva_jogadores_editados_externamente()
    {
        var file = NewFile();
        using var store = new LoadoutStore(file, _ => { });

        var a = store.GetOrCreate(76561198000000001UL, "A");
        a.Knife = new KnifePick { Id = "weapon_knife_butterfly", DefIndex = 666, PaintKit = 10010 };
        store.Save();

        // edicao externa (painel): adiciona o jogador B direto no arquivo
        var external = new LoadoutFile
        {
            Players = new List<PlayerLoadout> { new() { SteamId = "76561198000000002", Name = "Panel" } }
        };
        File.WriteAllText(file, JsonSerializer.Serialize(external));

        var c = store.GetOrCreate(76561198000000003UL, "C");
        c.Gloves = new GlovePick { DefIndex = 1, PaintKit = 10018 };
        store.Save();

        var final = JsonSerializer.Deserialize<LoadoutFile>(File.ReadAllText(file))!;
        var ids = final.Players.Select(p => p.SteamId).ToHashSet();
        Assert.Contains("76561198000000001", ids); // A (memoria)
        Assert.Contains("76561198000000002", ids); // B (externo preservado)
        Assert.Contains("76561198000000003", ids); // C (memoria)
    }

    [Fact]
    public void Reload_externo_preserva_picks_feitos_em_jogo()
    {
        var file = NewFile();
        using var store = new LoadoutStore(file, _ => { });

        var a = store.GetOrCreate(76561198000000001UL, "A");
        a.Knife = new KnifePick { Id = "weapon_knife_karambit", DefIndex = 10010, PaintKit = 10010 }; // ainda nao gravado

        // painel grava apenas o jogador B
        var external = new LoadoutFile
        {
            Players = new List<PlayerLoadout> { new() { SteamId = "76561198000000002", Name = "Panel" } }
        };
        File.WriteAllText(file, JsonSerializer.Serialize(external));

        // forca o reload como se o watcher tivesse disparado
        store.ReloadForTest();
        var reloaded = store.GetOrCreate(76561198000000001UL, "A");
        Assert.Equal("weapon_knife_karambit", reloaded.Knife?.Id); // A nao foi perdido

        var b = store.GetOrCreate(76561198000000002UL, "Panel");
        Assert.Equal("Panel", b.Name);
    }

    [Fact]
    public void GetOrCreate_persiste_StatTrak_por_arma()
    {
        var file = NewFile();
        using var store = new LoadoutStore(file, _ => { });

        var p = store.GetOrCreate(76561198000000001UL, "Player");
        p.Weapons["weapon_ak47"] = new WeaponPick { PaintKit = 1466, StatTrak = true, StatTrakKills = 7 };
        store.Save();

        var reloaded = store.GetOrCreate(76561198000000001UL, "Player");
        Assert.True(reloaded.Weapons.TryGetValue("weapon_ak47", out var pick));
        Assert.Equal(7, pick.StatTrakKills);
    }
}
