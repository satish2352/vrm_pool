const cron = require('node-cron');
const { exec } = require('child_process');

// Schedule the job to run on the first day of every month at 11:59 PM
const job = cron.schedule('59 23 1 * *', () => {
  // Execute your shell script
  exec('sh dumpdata.sh', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing the script: ${error}`);
    }
    console.log(`Script output: ${stdout}`);
    console.error(`Script errors: ${stderr}`);
  });
}, {
  timezone: 'Asia/Kolkata' // Specify your timezone here
});

job.start(); // Start the cron job
