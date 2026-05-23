#!/usr/bin/env node
/**
 * ASANMOD v1.0.0: QUICK STATUS
 * Fast, token-efficient system status for AI agents.
 */
const { exec } = require("child_process");

// Yardımcı: Komut çalıştırma (Promise wrapper)
function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      // 10MB buffer
      if (error) {
        // PM2 hatası olsa bile stderr döndürelim
        resolve({ error: error.message, stderr });
      } else {
        resolve({ stdout: stdout.trim() });
      }
    });
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function getSystemStatus() {
  try {
    // 1. PM2 Durumu
    const pm2Result = await run("pm2 jlist");

    let pm2Summary = [];
    let heavyProcesses = [];
    let allOnline = true;
    let totalMem = 0;

    if (pm2Result.stdout) {
      try {
        const processes = JSON.parse(pm2Result.stdout);

        processes.forEach((proc) => {
          const isOnline = proc.pm2_env.status === "online";
          if (!isOnline) allOnline = false;

          const mem = proc.monit ? proc.monit.memory : 0;
          totalMem += mem;

          // Kısa özet için sadece kritik bilgileri al
          pm2Summary.push({
            n: proc.name, // name
            s: proc.pm2_env.status === "online" ? "ON" : "OFF", // status
            // m: formatBytes(mem) // memory (detay kirliliği yapmasın diye kaldırdım, toplamı vereceğim)
          });
        });
      } catch (e) {
        pm2Summary = ["Error parsing PM2 output"];
      }
    }

    // 2. Disk Durumu (Root partition)
    const diskResult = await run("df -h / | tail -1 | awk '{print $5}'");
    const diskUsage = diskResult.stdout || "?";

    // 3. Sonuç Objesi (LLM Dostu - Minimal)
    const report = {
      sys: {
        disk: diskUsage,
        mem_used: formatBytes(totalMem),
      },
      pm2: {
        all_ok: allOnline,
        count: pm2Summary.length,
        // Eğer hepsi OK ise listeyi verme, sadece 'ALL GREEN' de.
        details: allOnline ? "ALL GREEN" : pm2Summary,
      },
    };

    // Tek satır JSON bas (Gereksiz whitespace yok)
    console.log(JSON.stringify(report));
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
  }
}

getSystemStatus();
