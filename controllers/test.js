const { dbObj, Report } = require('../models/Report'); // Assuming you have a Sequelize model named Report

async function aggregateStatusCounts() {
  try {
    
    // Fetch data from the database
    const reports = await Report.findAll();

    // Initialize an object to store aggregated counts
    const counts = {};

    // Process each row of the fetched data
    reports.forEach(report => {
      const { from_number, status } = report;

      // If the from_number is not yet in counts, initialize it with default counts
      if (!counts[from_number]) {
        counts[from_number] = {
          total: 0,
          Incoming: 0,
          Outgoing: 0,
          Completed: 0,
          // Add more status types as needed
        };
      }

      // Increment the total calls count and the count for the specific status type
      counts[from_number].total++;
      counts[from_number][status]++;
    });

    return counts;
  } catch (error) {
    console.error('Error retrieving and aggregating status counts:', error);
    throw error;
  }
}

// Usage example
aggregateStatusCounts()
  .then(counts => {
    console.log(counts);
  })
  .catch(error => {
    console.error('Error:', error);
  });
