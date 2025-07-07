#!/bin/bash

# Jetson Control Script
# Einfache Verwaltung der Card Game Services

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}🎮 Card Game Jetson Control${NC}"
    echo -e "${BLUE}=============================${NC}"
}

print_status() {
    echo -e "\n${YELLOW}📊 Service Status:${NC}"
    echo -e "${YELLOW}------------------${NC}"
    
    # Card Game Status
    if systemctl is-active --quiet card-game; then
        echo -e "Card Game: ${GREEN}🟢 Running${NC}"
    else
        echo -e "Card Game: ${RED}🔴 Stopped${NC}"
    fi
    
    # Ngrok Status
    if systemctl is-active --quiet ngrok; then
        echo -e "Ngrok:     ${GREEN}🟢 Running${NC}"
        
        # URL abrufen falls möglich
        URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | jq -r '.tunnels[0].public_url' 2>/dev/null)
        if [ "$URL" != "null" ] && [ -n "$URL" ]; then
            echo -e "URL:       ${GREEN}$URL${NC}"
        fi
    else
        echo -e "Ngrok:     ${RED}🔴 Stopped${NC}"
    fi
}

start_services() {
    echo -e "\n${GREEN}🚀 Starting Services...${NC}"
    
    echo "Starting Card Game..."
    sudo systemctl start card-game
    
    echo "Starting Ngrok..."
    sudo systemctl start ngrok
    
    echo -e "${GREEN}✅ Services started!${NC}"
    sleep 2
    print_status
}

stop_services() {
    echo -e "\n${RED}🛑 Stopping Services...${NC}"
    
    echo "Stopping Ngrok..."
    sudo systemctl stop ngrok
    
    echo "Stopping Card Game..."
    sudo systemctl stop card-game
    
    echo -e "${RED}✅ Services stopped!${NC}"
    sleep 1
    print_status
}

restart_services() {
    echo -e "\n${YELLOW}🔄 Restarting Services...${NC}"
    
    echo "Restarting Card Game..."
    sudo systemctl restart card-game
    
    echo "Restarting Ngrok..."
    sudo systemctl restart ngrok
    
    echo -e "${GREEN}✅ Services restarted!${NC}"
    sleep 2
    print_status
}

get_url() {
    echo -e "\n${BLUE}🌐 Getting Public URL...${NC}"
    
    # Warten bis ngrok bereit ist
    for i in {1..10}; do
        URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | jq -r '.tunnels[0].public_url' 2>/dev/null)
        if [ "$URL" != "null" ] && [ -n "$URL" ]; then
            echo -e "Public URL: ${GREEN}$URL${NC}"
            echo -e "Share this URL with your friends! 🎮"
            return
        fi
        echo "Waiting for ngrok... ($i/10)"
        sleep 1
    done
    
    echo -e "${RED}❌ Could not get URL. Is ngrok running?${NC}"
}

show_logs() {
    echo -e "\n${BLUE}📋 Service Logs:${NC}"
    echo -e "${BLUE}=================${NC}"
    
    case $1 in
        "game")
            echo "Card Game logs (last 20 lines):"
            sudo journalctl -u card-game -n 20 --no-pager
            ;;
        "ngrok")
            echo "Ngrok logs (last 20 lines):"
            sudo journalctl -u ngrok -n 20 --no-pager
            ;;
        *)
            echo "Available logs: game, ngrok"
            echo "Usage: $0 logs [game|ngrok]"
            ;;
    esac
}

show_help() {
    echo -e "\n${YELLOW}📖 Available Commands:${NC}"
    echo -e "${YELLOW}======================${NC}"
    echo "start     - Start both services"
    echo "stop      - Stop both services"
    echo "restart   - Restart both services"
    echo "status    - Show service status"
    echo "url       - Get public URL"
    echo "logs      - Show logs [game|ngrok]"
    echo "help      - Show this help"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "$0 start"
    echo "$0 logs game"
    echo "$0 url"
}

# Main logic
print_header

case $1 in
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "status")
        print_status
        ;;
    "url")
        get_url
        ;;
    "logs")
        show_logs $2
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_status
        show_help
        ;;
esac
