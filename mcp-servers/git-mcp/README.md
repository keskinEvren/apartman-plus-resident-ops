# 🔓 Git MCP Server - Ücretsiz Yerel Git

**Versiyon:** 1.0.0
**Açıklama:** Yerel git komutlarını MCP tool'ları olarak kullanın

---

## ✅ Özellikler

- ✅ Tamamen ücretsiz
- ✅ Yerel git komutları
- ✅ Hiçbir auth gerekmez
- ✅ Tam kontrol

---

## 🛠️ Tool'lar

1. **git_status** - Git durumu
2. **git_log** - Commit log
3. **git_branch** - Branch listesi/oluşturma
4. **git_blame** - Dosya blame
5. **git_add** - Dosya ekleme
6. **git_commit** - Commit oluşturma
7. **git_checkout** - Branch checkout
8. **git_stash** - Stash işlemleri
9. **git_diff** - Diff görüntüleme
10. **git_worktree** - Worktree yönetimi

---

## 📦 Kurulum

```bash
cd mcp-servers/git-mcp
npm install
npm run build
```

---

## ⚙️ Yapılandırma

`~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "git": {
      "command": "node",
      "args": [
        "/Users/apple/Desktop/projects/ASANMODcursor/mcp-servers/git-mcp/dist/index.js"
      ]
    }
  }
}
```

---

## 🎯 Kullanım

Cursor'ı yeniden başlatın, `git_*` tool'ları kullanılabilir olacak.

---

**Not:** GitKraken yerine tamamen ücretsiz ve yerel git kullanır.
