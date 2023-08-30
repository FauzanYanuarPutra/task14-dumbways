const express = require("express");
const app = express();
var methodOverride = require("method-override");
const { v4: uuidv4 } = require("uuid");

const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "src/assets/images/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// sequalize image
const config = require("./src/config/config.json");
const { Sequelize, QueryTypes, ARRAY } = require("sequelize");
const sequelize = new Sequelize(config.development);

const path = require("path");
const port = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("views", path.join(__dirname, "src/"));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.post("/projects", upload.single("image"), postProject);
app.use(express.static("src/assets"));

app.get("/", home);
app.get("/projects/:id", showProject);
app.post("/projects", upload.single("image"), postProject);
app.patch("/projects/:id", upload.single("image"), updateProject);
app.delete("/projects/:id", deleteProject);

app.get("/testi", testi);
app.get("/testi/rating/:bintang", testiBintang);
app.get("/contact", contact);
app.post("/contact", postContact);

app.listen(port, () => {
  console.log("Berjalan Di Port http://localhost:5000");
});

const availableTechnologies = [
  { value: "node-js", label: "Node.js" },
  { value: "react", label: "React" },
  { value: "socket-io", label: "Socket io" },
  { value: "typescript", label: "Typescript" },
];

let dataTesti = [];

fetch("https://api.npoint.io/11be16bc5f763e5ba191")
  .then((response) => response.json())
  .then((testimonials) => {
    dataTesti.push(...testimonials);
  })
  .catch((error) => {
    console.error("Error fetching testimonials:", error);
  });

async function home(req, res) {
  try {
    const query = `SELECT * FROM "Projects";`;
    const data = await sequelize.query(query, { type: QueryTypes.SELECT });

    res.render("views/index", {
      dataProject: data,
      availableTechnologies,
    });
  } catch (error) {
    console.log(error);
  }
}

async function showProject(req, res) {
  const id = req.params.id;

  try {
    const query = `SELECT * FROM "Projects" WHERE id=${id};`;
    const data = await sequelize.query(query, { type: QueryTypes.SELECT });

    const dataProject = data[0];

    res.render("views/detail", {
      dataProject,
      availableTechnologies,
    });
  } catch (error) {
    console.log(error);
  }
}

async function postProject(req, res) {
  try {
    const {
      name,
      start_date,
      end_date,
      technologies,
      description,
      image,
      imageDescription,
    } = req.body;

    const technologiesArray = Array.isArray(technologies)
      ? technologies.map((tech) => `'${tech}'`)
      : [`'${technologies}'`];

    await sequelize.query(`INSERT INTO "Projects"(
      name, start_date, end_date, description, technologies, image, "createdAt", "updatedAt")
      VALUES ('${name}', '${start_date}', '${end_date}', '${description}', ARRAY[${technologiesArray}], '${
      "/images/" + req.file.filename
    }', NOW(), NOW());`);

    console.log("data baru");
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
}

async function updateProject(req, res) {
  try {
    const id = req.params.id;

    const {
      name,
      start_date,
      end_date,
      technologies,
      description,
      image,
      imageDescription,
    } = req.body;

    const technologiesArray = Array.isArray(technologies)
      ? technologies.map((tech) => `'${tech}'`)
      : [`'${technologies}'`];

    let updateQuery = `UPDATE "Projects"
      SET name='${name}', start_date='${start_date}', end_date='${end_date}', description='${description}', technologies=ARRAY[${technologiesArray}], "updatedAt"=NOW()`;

    if (req.file) {
      const currentImageQuery = `SELECT image FROM "Projects" WHERE id=${id}`;
      const currentImageObj = await sequelize.query(currentImageQuery, {
        type: QueryTypes.SELECT,
      });
      const currentImage = currentImageObj[0].image;

      const fs = require("fs");
      const imagePath = path.join(__dirname, "src/assets", currentImage);
      fs.unlinkSync(imagePath);

      updateQuery += `, image='${"/images/" + req.file.filename}'`;
    }

    updateQuery += ` WHERE id=${id}`;

    await sequelize.query(updateQuery);

    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
}

async function deleteProject(req, res) {
  const { id } = req.params;

  const currentImageQuery = `SELECT image FROM "Projects" WHERE id=${id}`;
  const currentImageObj = await sequelize.query(currentImageQuery, {
    type: QueryTypes.SELECT,
  });
  const currentImage = currentImageObj[0].image;

  const fs = require("fs");
  const imagePath = path.join(__dirname, "src/assets", currentImage);
  fs.unlinkSync(imagePath);

  await sequelize.query(`DELETE FROM "Projects" WHERE id=${id}`);

  res.redirect("/");
}

// end project

function testi(req, res) {
  res.render("views/testimonials", { dataTesti });
}

function testiBintang(req, res) {
  const { bintang } = req.params;
  const dataBintang = dataTesti.filter((b) => b.rating == bintang);
  res.render("views/testimonials", { dataTesti: dataBintang, bintang });
}

function contact(req, res) {
  res.render("views/contact");
}

function postContact(req, res) {
  try {
    const { name, email, phone, subject, message } = req.body;

    const emailReceiver = "fauzanyanuarp@gmail.com";
    const mailtoLink = `mailto:${name}?subject=${subject}&body=Hello nama saya ${name}, ${subject}, ${message}, hubungi saya email: ${email}, telp: ${phone}`;

    res.redirect(mailtoLink);
  } catch (error) {
    console.log(error);
  }
}
