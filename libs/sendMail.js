import nodemailer from "nodemailer";

const transpoter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "storywritings87@gmail.com",
    pass: "klbrjjtcvrwokaoc",
  },
  tls: {
    rejectUnauthorized: false, // Bypasses SSL verification (use with caution)
  },
});

export const sendMail = async (email, token) => {
  try {
    const success = await transpoter.sendMail({
      from: {
        name: "Server Test",
        address: "storywritings87@gmail.com",
      },
      to: email,
      subject: "Verify Your Email",

      html: `<div> <h1 style={{display:"flex";justifyContent:"center";alignItems:"center";backgroundColor:"blue"; font-size:"20px"}}>Welcome to servertest</h1> </div> <button> <a href="http://localhost:4001/verify?token=${token}">Verify your account${token}</a> </button> `,
    });
  } catch (error) {
    console.log(error);
  }
};

// sendMail(transpoter, mailOptions).catch(console.log(error));
