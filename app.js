//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const  _ = require("lodash");

mongoose.set('strictQuery', false);
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://surbhisingh0522:surbhisingh0522@cluster0.z8bfj7r.mongodb.net/todoListDB");
//mongoose.connect("mongodb://127.0.0.1:27017/todoListDB");

const itemsSchema=new mongoose.Schema({
  name:String
});

const Item=new mongoose.model("Item",itemsSchema);

const item1=new Item({
  name:"Welcome to your to do list!"
})
const item2=new Item({
  name:"Hit the + button to add a new item."
})
const item3=new Item({
  name:"<-- Hit this to delete an item."
})
const defaultItems=[item1, item2, item3];

const listSchema={
  name:String,
  items:[itemsSchema]
}
const List=mongoose.model("List",listSchema);


app.get("/", function(req, res) {

  Item.find({}).then( function(foundItems){
    if(foundItems.length===0){
      Item.insertMany(defaultItems).then(function(){
        console.log("Default items inserted successfully to DB");
    }).catch(function(err){
      console.log("Error inserting default items: ",err);
    });
    res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }    
   })
   .catch(function(err){
    console.log(err);

   })
});

app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);
 
  List.findOne({name:customListName})
    .then(function(foundList){
        
        if(!foundList){
            const list = new List({
              name:customListName,
              items:defaultItems
            });
          
            
            console.log("saved");          
            list.save().then(function() {
                res.redirect("/" + customListName);
            });
          
          }else{
            res.render("list",{listTitle:foundList.name, newListItems:foundList.items});
          }
    })
    .catch(function(err){});  
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  let listName=req.body.list.trim();
  
  const item=new Item({
    name:itemName
  });
  if(listName==="Today"){
    item.save();
   res.redirect("/");
  }else{
    List.findOneAndUpdate(
      { name: listName },
      { $push: { items: item } }
    )
      .then(function(foundList) {
        if (foundList) {
          res.redirect("/" + listName);
        } else {
          const list = new List({
            name: listName,
            items: [item]
          });
          list.save();
          console.log("List created:", list);
          res.redirect("/" + listName);
        }
    });
  }
   
});

app.post("/delete",function(req,res){
  const checkedItemId=req.body.checkbox;
  const listName=req.body.listName;
  if(listName==="Today"){
    Item.findByIdAndRemove({_id:checkedItemId}).exec().then(()=>{
      console.log("Removed successfully")
        res.redirect("/");       
      }).catch((error)=>{
          console.log("Error removing : ",error);
      });
 }else{
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id:checkedItemId}}}).exec().then(()=>{
          res.redirect("/"+listName);
    }).catch((error)=>{
      console.log(error);
    });  
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
