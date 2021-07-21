//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


//connect to the database
mongoose.connect("mongodb+srv://username:password@cluster0.sdhkd.mongodb.net/todolistDB",{useNewUrlParser:true, useUnifiedTopology: true });

// schema to the model
const itemsSchema = {
  name:String
}

//model - collection
const items = mongoose.model("item",itemsSchema);

// Initial documents
const item1 = new items({
  name:"Welcome to your todolist!"
})
const item2 = new items({
  name:"Hit the + button to add the new item"
})
const item3 = new items({
  name:"<-- Hit this to delete an item"
})

const defaultItems= [item1,item2,item3];

//schema - newList
const listSchema = new mongoose.Schema({
  name:String,
  items:[itemsSchema]
})
//model - newlist
const List = mongoose.model("List",listSchema);


//root route

app.get("/", function(req, res) {

  items.find(function(err,dbItems){
    //if new collection
    if(dbItems.length===0){
      items.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Data inserted successfully");
        }
      });
      res.redirect("/");

    }else{
      res.render("list", {listTitle: "Today", newListItems: dbItems});
    }    
        
  })

});


//add new item
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  
  const item = new items({
    name:itemName
  })
  if(listName==="Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName},function(err,foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+listName);
    })
  }
});

//delete item
app.post("/delete",function(req,res){
 const checkedItemId = req.body.checkbox;
 const listName = req.body.listName;
 if(listName==="Today"){
  items.findByIdAndRemove(checkedItemId,function(err){
    if(!err){
      console.log("data deleted successfully");
      res.redirect("/");
    }
  })
 }
 else{
   List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err){
    if(!err){
      res.redirect("/"+listName);
    }
   });
 }

 
})


app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name:customListName},function(err,foundList){
    if(!err){
      if(!foundList){
      // create a new list
      const list = new List({
        name:customListName,
        items:defaultItems
      });
      
      list.save();
      
      res.redirect("/" + customListName);

      }else{
        // show an existing list
       res.render("list",{
         listTitle:customListName,
         newListItems:foundList.items
       });
      }
    }
  })
 

})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started succesfully");
});
