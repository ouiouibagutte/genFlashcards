// dumb comment
const readline = require('readline');
const wiki = require('wikipedia');
const { createCanvas, loadImage } = require('canvas');
const fetch = require('node-fetch');
const fs = require('fs');
let terms;

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask the user for input
function askUserInput(callback) {
  rl.question('Enter a list of terms to create flashcards preferably names of wikipedia articles to reduce risk of errors: ', (input) => {
    // Split the input string into an array of terms
    terms = input.split(',').map(term => term.trim());
    
    // Log the array of terms
    console.log('vocab entered:', terms);

    // Ask the user to confirm if the entered list is correct
    rl.question('Is this list correct? (y/n): ', (answer) => {
      answer = answer.toLowerCase();
      if (answer === 'y') {
        // Close the readline interface if the user confirms
        rl.close();
        // Pass the terms array to the callback function
        callback(terms);
      } else if (answer === 'n') {
        // If the user says no, rerun the input process
        askUserInput(callback);
      } else {
        // Handle invalid input
        console.log('Invalid input. Please enter "y" or "n".');
        // Rerun the input process
        askUserInput(callback);
      }
    });
  });
}

async function addTextToImage(url, text, filename) {
    try {
        // Load the image from the URL
        const response = await fetch(url);
        const imageData = await response.arrayBuffer();
        const image = await loadImage(Buffer.from(imageData));

        // Create a canvas with the same dimensions as the image
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        // Draw the image onto the canvas
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Set up text properties
        const fontSize = 50;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';

        // Define maximum line width (80% of image width)
        const maxWidth = canvas.width * 0.8;

        // Split text into multiple lines based on word wrapping
        let lines = [];
        let line = '';
        const words = text.split(' ');
        for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            const lineWidth = metrics.width;
            if (lineWidth > maxWidth && line.length > 0) {
                lines.push(line);
                line = word + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);

        // Calculate vertical position for text
        const lineHeight = fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        let y = (canvas.height - totalHeight) / 2 + fontSize / 2;

        // Draw each line of text onto the canvas
        for (const line of lines) {
            ctx.fillText(line, canvas.width / 2, y);
            y += lineHeight;
        }

        // Save the canvas as an image file
        const stream = canvas.createPNGStream();
        const out = fs.createWriteStream(filename);
        stream.pipe(out);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Call the function to ask for user input
askUserInput((terms) => {
  console.log("got little people in your comp working on flashcards...");
  terms.forEach((term, index) => {
    (async () => {
        try {
            const summary = await wiki.summary(term);
            const ans = summary.extract;
            addTextToImage(
                'https://static.wikia.nocookie.net/kungfupanda/images/e/e6/PoKungFuPose.jpg/revision/latest?cb=20150429233522', // URL of the background image
                `${term}`,
                `${term}A.png`
            );
            addTextToImage(
                'https://static.wikia.nocookie.net/kungfupanda/images/e/e6/PoKungFuPose.jpg/revision/latest?cb=20150429233522', // URL of the background image
                `${ans}`,
                `${term}B.png`
            );
            console.log("Done processing " + term);
            //Response of type @wikiSummary - contains the intro and the main image
        } catch (error) {
            //console.log(error);
            console.log("Woops seems like something went wrong moving onto next word");
            //=> Typeof wikiError
        }
    })();
    // Perform your desired action for each term here
  });
});
