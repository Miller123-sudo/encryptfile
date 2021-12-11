const express = require("express");
const upload = require("express-fileupload");
const bodyparser = require("body-parser");
const folderEncrypt = require("folder-encrypt");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
var childProcess = require("child_process");
const ShredFile = require("shredfile");
let alert = require("alert");

const app = express();
const shredder = new ShredFile();

app.use(upload());
app.use(express.static(path.join(__dirname, "static")));

//configure pug
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Config session
app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "gdaheiutm123@hdg",
  })
);

// `bodyParser` includes `multipart`
// app.use(bodyparser());
// app.use(bodyparser.urlencoded({ extended: false }));

// Serve index page
app.get("/", (req, res) => {
  res.render("index");
});

// Encrypt file route
app.post("/", (req, res) => {
  console.log(req.files);
  const file = req.files.files;
  console.log(file);
  filename = file.name;
  console.log(filename);

  if (!filename) {
    res.render("error");
  }

  // Upload the file
  file.mv("./uploads/" + filename, function (err) {
    if (err) {
      res.send(err);
    } else {
      //Encrypt file
      folderEncrypt
        .encrypt({
          password: "111",
          input: path.join(__dirname, "/uploads"),
          output: path.join(__dirname, "/encryptfiles/", filename + ".PCT"),
        })
        .then(() => {
          //delete uploaded files in uploads folder
          fs.readdir(path.join(__dirname, "/uploads"), (err, files) => {
            if (err) {
              console.log(err);
            } else {
              for (let file of files) {
                fs.unlink("./uploads/" + file, (error) => {
                  if (error) {
                    console.log(error);
                  } else {
                    console.log("files deleted successfully");
                  }
                });
              }
            }
          });

          console.log("encrypted!");
        })
        .catch((err) => {
          console.log(err);
        });

      res.redirect("/");
      // res.render("index", { encrypt_btn_show: true });
    }
  });

  // res.sendFile(__dirname + "/index.html");
});

// Decrypt file route
app.post("/decrypt", function (req, res) {
  console.log(req.files);
  const file = req.files.files;
  filename = file.name;
  console.log(filename);
  newfilename = filename.slice(0, -10);
  console.log(newfilename);
  console.log(path.join(__dirname, "/uploads/", filename));

  // Upload the file
  file.mv(__dirname + "/uploads/" + filename, function (err) {
    if (err) {
      res.send(err);
    } else {
      //Decrypt file
      folderEncrypt
        .decrypt({
          password: "111",
          input: path.join(__dirname, "/uploads/", filename),
          output:
            // "D:/Paapri (extract.me)/Paapri/Projects/NodeJS and React programs/NodeJS program/encrypt file/encryptfiles/",
            path.join(__dirname, "/encryptfiles/"),
        })
        .then(() => {
          //move uploaded files from uploads folder
          fs.readdir(path.join(__dirname, "/uploads"), (err, files) => {
            if (err) {
              console.log(err);
            } else {
              for (let file of files) {
                console.log("files: " + file);
                console.log(
                  "file_path: " + path.join(__dirname, "/uploads/", file)
                );

                fs.rename(
                  __dirname + "/uploads/" + file,
                  __dirname + "/deletedfiles/" + file,
                  function (err) {
                    fs.unlinkSync(path.join(__dirname, "/deletedfiles/", file));
                    console.log(
                      "files moved from uploads successfully while decryption"
                    );
                  }
                );

                // fs.unlink(__dirname + "/uploads/" + file, (error) => {
                //   if (error) {
                //     console.log(error);
                //   } else {

                //     console.log("files deleted successfully while decryption");
                //   }
                // });
              }
            }
          });

          console.log("decrypted!");
          // res.redirect("/");
        })
        .catch((err) => {
          console.log(err);
        });

      res.redirect("/");
      // res.render("index", { decrypt_btn_show: true });
    }
  });
});

// Download the file
app.get("/download", function (req, res) {
  fs.readdir(path.join(__dirname, "/encryptfiles/"), (error, files) => {
    if (error) {
      console.log(error);
    } else {
      // Check whether the folder contain any file or not. If not show warning message, else download the file
      if (files == "") {
        console.log("files when not download:" + files);
        res.render("index", {
          msg: "No such file present for download. Please choose file!!!",
        });
      } else {
        fs.readdir(__dirname + "/encryptfiles/", (error, files) => {
          if (error) {
            console.log(error);
          } else {
            console.log(files);
            console.log(__dirname + "\\encryptfiles\\");

            res.download(
              __dirname + "\\encryptfiles\\" + files[0],
              function (err) {
                if (err) {
                  console.log(err);
                } else {
                  console.log("download successfull");

                  //Delete encrypted file
                  fs.readdir(
                    path.join(__dirname, "/encryptfiles"),
                    (err, files) => {
                      if (err) {
                        console.log(err);
                      } else {
                        for (let file of files) {
                          fs.unlink("./encryptfiles/" + file, (error) => {
                            if (error) {
                              console.log(error);
                            } else {
                              console.log("Encrypt files deleted successfully");
                            }
                          });
                        }
                      }
                    }
                  );
                }
              }
            );
          }
        });
      }
    }
  });

  res.redirect("/");
});

// Run server
app.listen(5000, () => {
  console.log(`app running on port 5000`);
});
