require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _= require("lodash");
//encryption require
const encrypt = require("mongoose-encryption");
const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb://localhost:27017/todoeyDB1", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
mongoose.set("useCreateIndex",true);
mongoose.set('returnOriginal', false);

//Schema for user entry
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

//encryption plugin
userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields:["password"]});
//userschema model
const User = new mongoose.model("User", userSchema);

// item schema
const itemSchema = {
  unique: false,
  name: String
}

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name:"Welcome to Todoey"
});

const item2 = new Item({
  name:"Hit + button to add new task"
});

const item3 = new Item({
  name:"<-- Hit to delete task"
});

const defaultItems = [item1, item2, item3];

//coustomlist schema
const customListSchema = {
  name: String,
  items: [itemSchema]
};

const customList = mongoose.model("customList", customListSchema);

//get default rout
app.get("/", function(req, res){
    res.render("home");
});

//get about rout
app.get("/about", function(req, res){
    res.render("about");
});    

//get signup rout
app.get("/signup", function(req, res){
  res.render("signup");
});

//get login rout
app.get("/login", function(req, res){
  console.log("login");
  res.render("login");
});

//get logout rout
app.get("/logout", function(req,res){
  //req.logout();
  res.redirect("/");
});

//signup using encryption
app.post("/signup", function(req,res){
  const newUser = new User({
    email: req.body.emailID,
    password: req.body.password
  });

  newUser.save(function(err){
    if(err){
      console.log(err);
    }else{
      res.redirect("/login");
    }
  });
});

//login using encription 
app.post("/login", function(req,res){
  const username = req.body.emailID;
  const password = req.body.password;

  //find users email
  User.findOne({email: username},function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        //find users password
        if(foundUser.password === password){
          Item.find({}, function(err, foundItems){ 
            if(foundItems.length === 0){
              Item.insertMany(defaultItems, function(err){
              if(err){
                console.log(err);
              }else{
                console.log("Successfully saved default to Db.");
              }
            });
            //res.render("list",{listTitle: "Today",  newListItems: foundItems});
              res.redirect("/list");
            }else{
             // res.render("list",{listTitle: "Today",  newListItems: foundItems});
                res.redirect("/list");
            } 
          });
        }else{
          console.log("password not match");
        }
      }
    }
  });
});

//get list
app.get("/list",function(req,res){

  Item.find({}, function(err, foundItems){
  
    //check length of default list
    if(foundItems.length === 0){
         Item.insertMany(defaultItems, function(err){
        if(err){
            console.log(err);
        }else{
            console.log("Successfully add data to todolistDB");
           }
          });
      res.redirect("/list");
    }else{
      res.render("list",{listTitle: "Today",  newListItems: foundItems});
    }
  });
});

//post list
app.post("/list",function(req,res){
	const itemName = req.body.newItem;
	const listName = req.body.list;
	console.log(req.body);
	
	if(listName === "Today"){
		const item = new Item({
			name : itemName
		});
		console.log("save item in default lists");
    //save data to default list
		item.save();
		res.redirect("/list");
	}else{
    //create new custom list
		const item = new customList({
			name : itemName
		});
		customList.findOne({name: listName}, function(err, foundList){
			foundList.items.push(item);
			console.log("save item to custom list");
      //save data to custom list
			foundList.save();
			res.redirect("/"+ listName);
		});
	}  
});

//get custom list
app.get("/:customListName",function(req,res){
	console.log(req.params.customListName);
	const customListName = _.capitalize(req.params.customListName);
	
  //find custom list name
	customList.findOne({name: customListName}, function(err, foundList){
		if(!err){
			if(!foundList){
				console.log("does not exists");
				//cretae new list
				const clist = new customList({
					name: customListName,
					items: defaultItems
				});
				clist.save();
				res.redirect("/"+ customListName);
			}else{
				//show existing list
				console.log("exists");
				res.render("list",{listTitle: foundList.name,  newListItems: foundList.items});
			}
		}
	});
});

//delete list
app.post("/delete", function(req,res){
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;
  console.log(listName);
	if(listName === "Today"){
    //delete data from default list
		Item.findByIdAndRemove(checkedItemId, function(err){
			if(!err){
				console.log("Successfully deleted item from default list db");
				res.redirect("/list");
			}
		});
	}else{
    //find and update custom list
		customList.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
			if(!err){
				console.log("successfully deleted item from custom list");
				res.redirect("/"+listName);
			}
		});
	}	
});	

//App is listioning on port 5000
app.listen(5000,function(){
    console.log("server running on port 5000");
});
    
















