#!/bin/bash

# ASANMOD v1.0.0: IRON GIT GUARD
# "Bizde hata halının altına süpürülmez, çözülür."

function git() {
    local is_commit=false
    local forbidden_flag=false

    # Basit argüman kontrolü
    for arg in "$@"; do
        if [[ "$arg" == "commit" ]]; then
            is_commit=true
        fi
        if [[ "$arg" == "--no-verify" || "$arg" == "-n" ]]; then
            forbidden_flag=true
        fi
    done

    # Eğer commit ve yasaklı flag varsa engelle
    if [[ "$is_commit" == "true" && "$forbidden_flag" == "true" ]]; then
        echo -e "\033[0;31m"
        echo "╔════════════════════════════════════════════════════════════╗"
        echo "║ ⛔ ASANMOD SENTINEL: PROTOKOL İHLALİ TESPİT EDİLDİ        ║"
        echo "╠════════════════════════════════════════════════════════════╣"
        echo "║ TESPİT EDİLEN BAYRAK: --no-verify / -n                     ║"
        echo "║                                                            ║"
        echo "║ BU SİSTEMDE KOD DOĞRULAMASINI ATLAMAK YASAKTIR.            ║"
        echo "║                                                            ║"
        echo "║ \"Hatalar ihmal edilmek için değil, çözülmek içindir.\"      ║"
        echo "║                                                            ║"
        echo "║ İŞLEM: ENGELLENDİ                                          ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo -e "\033[0m"
        return 1
    fi

    # Orijinal git komutunu çalıştır
    command git "$@"
}

export -f git
