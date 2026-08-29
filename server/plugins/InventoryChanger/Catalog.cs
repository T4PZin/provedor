using System.Text.Json;

namespace InventoryChanger;

public sealed class Catalog
{
    public List<ItemEntry> Weapons { get; set; } = new();
    public List<ItemEntry> Knives { get; set; } = new();
    public List<ItemEntry> Gloves { get; set; } = new();
    public List<AgentEntry> Agents { get; set; } = new();

    private static readonly JsonSerializerOptions Options = new() { PropertyNameCaseInsensitive = true };

    public static Catalog Load(string path)
    {
        if (!File.Exists(path))
            throw new FileNotFoundException($"Catalogo nao encontrado: {path}");

        var json = File.ReadAllText(path);
        return JsonSerializer.Deserialize<Catalog>(json, Options) ?? new Catalog();
    }

    public AgentEntry? FindAgent(string id) => Agents.FirstOrDefault(a => a.Id == id);
}
