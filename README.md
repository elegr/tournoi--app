# tournoi--app
appli pour tracker les résultats de poker 

# Tournois App

This project is a web application used to track tournament results.  
Users can enter the date, the buy-in, and the result of each tournament.  
The application calculates total cost, total gains, net profit, and ROI automatically.

The application runs entirely in the browser.  
It allows the user to select a folder on their computer, load the most recent JSON file, and save updated data back into that folder.

## Usage

Open the website in a compatible browser such as Chrome or Edge.  
Click on "Choose folder" to select your storage directory.  
Click on "Load latest file" to import the most recent data.  
Add new tournament results using the form.  
Click on "Save" to create a new JSON file with updated data.

## Technologies

This project uses HTML, CSS, and JavaScript.  
It also uses the File System Access API to read and write files directly from the browser.


## File Format

Data is stored in JSON files with the following format: tournois_YYYY-MM-DD_HH-MM-SS.json
