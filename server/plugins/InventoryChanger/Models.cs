namespace InventoryChanger;

// ---- Inventario escolhido pelo jogador (loadouts.json) ----

public class WeaponPick
{
    public int PaintKit { get; set; }
    public float Wear { get; set; } = 0.01f;
    public int Seed { get; set; }
    public bool StatTrak { get; set; }
    public int StatTrakKills { get; set; }
    public string NameTag { get; set; } = "";
}

public sealed class KnifePick : WeaponPick
{
    public string Id { get; set; } = "";
    public int DefIndex { get; set; }
}

public sealed class GlovePick
{
    public int DefIndex { get; set; }
    public int PaintKit { get; set; }
    public float Wear { get; set; } = 0.25f;
    public int Seed { get; set; }
}

public sealed class PlayerLoadout
{
    public string SteamId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Agent { get; set; } = "";
    public KnifePick? Knife { get; set; }
    public GlovePick? Gloves { get; set; }
    public Dictionary<string, WeaponPick> Weapons { get; set; } = new();
}

public sealed class LoadoutFile
{
    public List<PlayerLoadout> Players { get; set; } = new();
}

// ---- Catalogo de itens disponiveis (skins.json) ----

public sealed class PaintEntry
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Rarity { get; set; } = "";
    public string Image { get; set; } = "";
}

public sealed class ItemEntry
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public int DefIndex { get; set; }
    public List<PaintEntry> Paints { get; set; } = new();
}

public sealed class AgentEntry
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Model { get; set; } = "";
    public int Team { get; set; } // 2 = TR, 3 = CT
}
