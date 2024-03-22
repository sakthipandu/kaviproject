const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const pool = require('../db');


// usersignup...
const userSingup = async (request, response) => {
    const { name, email_id, phone_no, password } = request.body
  
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
  
    try {
  
      const checkUserQuery = 'SELECT * FROM usersingup WHERE email_id = $1';
      const userCheckResult = await pool.query(checkUserQuery, [email_id]);
  
      if (userCheckResult.rows.length > 0) {
        return response.status(400).json({ error: 'email_id already exists' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      await pool.query('INSERT INTO usersingup (name, email_id, phone_no, password, verificationCode) VALUES ($1, $2, $3, $4, $5)',
        [name, email_id, phone_no, hashedPassword, verificationCode]);
  
      await sendOTPEmail(email_id, password, verificationCode, name, response);
    }
    catch (error) {
      console.error('Error:', error);
      response.status(500).json({ error: 'Internal server error' });
    }
  };
  async function sendOTPEmail(email, password, verificationCode, name, response) {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: 'sakthi032vel@gmail.com',
        pass: 'ttjzpkoyqhgdzond',
      },
    });
    const mailOptions = {
      from: 'sakthi032vel@gmail.com',
      to: email,
      subject: 'Your Email Verification',
      html: `<h1><font style="font-family: 'arial'">Verify Your Email Address</font></h1>
          <p><font color="black" size="3" style="font-family: 'arial'">HI ${name}.Your password. <strong>${password}</strong>..Thanks for starting the new KaviWeb account creation process. We want to make sure it's really you. Please enter the following verification code when prompted. </font></p>
          <p align="center"><font size="4" style="font-family: 'arial'"><strong>Verification code </strong></font><br> <font align="center" size="6" style="font-family: 'arial'"><strong>${verificationCode}</strong></font></p>`
    };
    try {
      await transporter.sendMail(mailOptions);
      response.status(200).json({ message: 'OTP sent successfully via email' });
    } catch (error) {
      console.error('Error sending email:', error);
      response.status(500).json({ error: 'Internal server error' });
    }
  };
  
  //user otp verification...
  const veriFyOTP = async (request, response) => {
    const { email_id, verificationCode } = request.body;
    try {
  
      const result = await pool.query('SELECT * FROM usersingup WHERE  email_id = $1 AND verificationCode = $2', [email_id, verificationCode]);
  
      if (result.rows.length === 1) {
        response.status(200).json({ message: ' Verification code successfully ' });
        console.log({ message: ' Verification code successfully ' });
      } else {
        response.status(400).json({ error: 'Verification code not match ' });
        console.log({ message: ' Verification code not match ' });
      }
    } catch (error) {
      console.error('Error:', error);
      response.status(500).json({ error: 'Internal server error' });
    }
  };

//user login...
  const userLogin = async(request, response) => {
    const { email_id, password } = request.body;
    try {
      const userResult = await pool.query('SELECT * FROM usersingup WHERE email_id = $1', [email_id]);
  
      if (userResult.rows.length > 0) {
        const storedPassword = userResult.rows[0].password;
        const passwordMatch = await bcrypt.compare(password, storedPassword);
  
        if (passwordMatch) {
          response.json({ success: true, message: 'Login successful' });
          console.log({ success: true, message: 'Login successful' });
        } else {
          response.status(401).json({ success: false, message: 'Invalid credentials' });
          console.log({ success: false, message: 'Invalid password' });
        }
      } else {
        response.status(401).json({ success: false, message: 'Invalid credentials' });
        console.log({ success: false, message: 'Invalid username' });
      }
    } catch (error) {
      console.error('Error executing query:', error);
      response.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
  
module.exports = {
    userSingup,
    veriFyOTP,
    userLogin
}  