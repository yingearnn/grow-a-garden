const pool = require("../services/db");

// Generate a random integer from 1 to max
function randomStock(maxStock) {
    return Math.floor(Math.random() * maxStock) + 1;
}

// Randomly select one tool as featured
function selectFeaturedTool(tools) {
    const index = Math.floor(Math.random() * tools.length);
    return tools[index].item_id;
}

// Refresh all tools in the shop
function refreshShop() {
    // Step 1: Get all tools from DB
    pool.query("SELECT item_id, max_stock FROM Tools", (err, results) => {
        if (err) return console.error("Error fetching tools:", err);

        const tools = results;

        // Step 2: Randomly update stock for each tool
        tools.forEach(tool => {
            const stock = randomStock(tool.max_stock);
            pool.query("UPDATE Tools SET stock = ?, is_featured = 0 WHERE item_id = ?", [stock, tool.item_id], err => {
                if (err) console.error("Error updating stock for tool", tool.item_id, err);
            });
        });

        // Step 3: Randomly select one tool as featured
        const featuredId = selectFeaturedTool(tools);
        pool.query("UPDATE Tools SET is_featured = 1 WHERE item_id = ?", [featuredId], err => {
            if (err) console.error("Error setting featured tool:", err);
            else console.log(`Shop refreshed! Featured tool: ${featuredId}`);
        });
    });
}

// Refresh shop every 5 minutes (300000 ms)
setInterval(refreshShop, 5 * 60 * 1000);

// Export for manual refresh if needed
module.exports = { refreshShop };
