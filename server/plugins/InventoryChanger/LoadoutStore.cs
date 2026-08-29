using System.Collections.Generic;
using System.Text.Json;

namespace InventoryChanger;

/// <summary>
/// Le e grava o loadouts.json. Observa o arquivo em disco e recarrega
/// automaticamente quando o painel de PC (ou outro processo) altera o arquivo.
/// </summary>
public sealed class LoadoutStore : IDisposable
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = true
    };

    private readonly string _path;
    private readonly object _sync = new();
    private readonly Action<string> _log;
    private readonly FileSystemWatcher _watcher;
    private DateTime _lastReload = DateTime.MinValue;
    private LoadoutFile _file = new();

    public LoadoutStore(string path, Action<string> log)
    {
        _path = path;
        _log = log;
        LoadFromDisk();

        var dir = Path.GetDirectoryName(path)!;
        _watcher = new FileSystemWatcher(dir, Path.GetFileName(path))
        {
            NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.Size | NotifyFilters.CreationTime,
            EnableRaisingEvents = true
        };
        _watcher.Changed += (_, _) => DebouncedReload();
        _watcher.Created += (_, _) => DebouncedReload();
        _watcher.Renamed += (_, _) => DebouncedReload();
    }

    public PlayerLoadout? Get(ulong steamId)
    {
        var key = steamId.ToString();
        lock (_sync) return _file.Players.FirstOrDefault(p => p.SteamId == key);
    }

    public PlayerLoadout GetOrCreate(ulong steamId, string name)
    {
        var key = steamId.ToString();
        lock (_sync)
        {
            var existing = _file.Players.FirstOrDefault(p => p.SteamId == key);
            if (existing is not null)
            {
                if (!string.IsNullOrWhiteSpace(name)) existing.Name = name;
                return existing;
            }

            var created = new PlayerLoadout { SteamId = key, Name = name };
            _file.Players.Add(created);
            return created;
        }
    }

    public void Reset(ulong steamId)
    {
        var key = steamId.ToString();
        lock (_sync) _file.Players.RemoveAll(p => p.SteamId == key);
        Save();
    }

    /// <summary>
    /// Grava o arquivo preservando jogadores que sofreram alteracao externa
    /// (ex.: edicao no painel de PC) e nao estao no estado de memoria deste
    /// plugin. Evita o "lost update" quando um kill de StatTrak e uma edicao
    /// no painel acontecem quase juntas. O estado de memoria deste plugin
    /// ganha para os jogadores que ele conhece; os demais vêm do disco.
    /// </summary>
    public void Save()
    {
        lock (_sync)
        {
            var disk = LoadFromDiskSafe();
            var known = new HashSet<string>(StringComparer.Ordinal);
            foreach (var p in _file.Players) known.Add(p.SteamId);
            foreach (var p in disk.Players)
                if (!known.Contains(p.SteamId)) _file.Players.Add(p);

            WriteFile(_file);
        }
    }

    private LoadoutFile LoadFromDiskSafe()
    {
        try
        {
            return File.Exists(_path)
                ? JsonSerializer.Deserialize<LoadoutFile>(File.ReadAllText(_path), Options) ?? new LoadoutFile()
                : new LoadoutFile();
        }
        catch
        {
            return new LoadoutFile();
        }
    }

    private void WriteFile(LoadoutFile file)
    {
        var tmp = _path + ".tmp";
        File.WriteAllText(tmp, JsonSerializer.Serialize(file, Options));
        File.Move(tmp, _path, overwrite: true);
    }

    private void LoadFromDisk()
    {
        lock (_sync)
        {
            var loaded = LoadFromDiskSafe();
            if (File.Exists(_path) && loaded.Players.Count == 0)
                _log("loadouts.json invalido, mantendo cache anterior");
            _file = loaded;
        }
    }

    private void DebouncedReload()
    {
        lock (_sync)
        {
            if ((DateTime.UtcNow - _lastReload).TotalMilliseconds < 800) return;
            _lastReload = DateTime.UtcNow;
        }

        Thread.Sleep(200); // espera a escrita do outro processo terminar
        lock (_sync) MergeDiskIntoMemory();
        _log("loadouts.json recarregado apos alteracao externa.");
    }

    private void MergeDiskIntoMemory()
    {
        var disk = LoadFromDiskSafe();
        var onDisk = new HashSet<string>(StringComparer.Ordinal);
        foreach (var p in disk.Players) onDisk.Add(p.SteamId);
        foreach (var p in _file.Players)
            if (!onDisk.Contains(p.SteamId)) disk.Players.Add(p);
        _file = disk;
    }

    internal void ReloadForTest() => MergeDiskIntoMemory();

    public void Dispose() => _watcher.Dispose();
}
