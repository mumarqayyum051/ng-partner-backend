const ejs = require('ejs');
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: process.env.EMAILER_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 *
 * @param {String} emailName - Name of the template
 * @param {Object} data - Data to fill the EJS template with
 */
const getEmailTemplate = (emailName, data) => {
  const options = {
    cache: true,
    filename: emailName,
  };
  return new Promise((resolve, reject) => {
    ejs.renderFile(`${__dirname}/templates/${emailName}.ejs`, data, options, (err, emailTemplate) => {
      if (err) {
        console.log(err);
        reject(err);
        return;
      }
      resolve(emailTemplate);
    });
  });
};
/**
 *
 * @param {String} to - email address of receiver
 * @param {Object} data - Data to fill the EJS template with
 * @param {String}  subject - subject of email
 * @param {String}  template - template of email to send
 */
const sendEmail = (to, data, subject, template) => {
  getEmailTemplate(template, data).then((html) => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: html,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  });
};

module.exports = {
  getEmailTemplate,
  sendEmail,
};
