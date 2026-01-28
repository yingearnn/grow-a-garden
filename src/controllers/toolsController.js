const toolsModel = require("../models/toolsModel.js");

module.exports.readToolsById = (req, res, next) =>
{
    const data = {
        id: req.params.id
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readPlantById:", error);
             return res.status(500).json(error);
        } else {
            if(results.length == 0) 
            {
               return res.status(404).json({
                    message: "Tool not found"
                });
            }
            else 
                req.tool = results[0]
                return next();



        }
    }

    toolsModel.selectToolsById(data, callback);
}

module.exports.buyTools = (req, res, next) =>

{
   
    
    // Check if user has enough points
     if(req.tool.cost > req.user.points) {
        return res.status(400).json({ message: "Insufficient points" });
    }
                         
     if (req.tool.stock <= 0) {
        return res.status(400).json({ message: "Tool out of stock" });
    }

    const data = {
      user_id: req.body.user_id,
      item_id: req.tool.item_id,
      points:req.item.cost

    } 
   
    // Insert plant bought into database
    const callback = (error, results, fields) => {
        if (error) {

            console.error("Error buyPlant:", error);
            return res.status(500).json(error);
        } 
           
        else {
   
  return res.status(201).json({
                
          message: "Plants value boosted"
            })
           
        }
    }
 // Call model function to insert purchase record
    toolsModel.boughtTool(data, callback);
}
