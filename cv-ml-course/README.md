# Computer Vision Machine Learning Course

This is a self-contained interactive HTML course that teaches the process of designing, training, and deploying computer vision machine learning models, with a focus on embedded systems like NVIDIA Orin NX and Qualcomm QCS8550.

## Structure

- `index.html` - Course home page
- `lesson1.html` - Introduction to Computer Vision and ML Pipeline
- `lesson2.html` - Data Collection and Annotation
- `lesson3.html` - Model Architecture Selection
- `lesson4.html` - Training Fundamentals and PyTorch Basics
- `lesson5.html` - Model Optimization and Quantization
- `lesson6.html` - Deployment to Embedded Systems
- `lesson7.html` - Real-time Inference and Tracking
- `lesson8.html` - ONNX Conversion and Optimization
- `lesson9.html` - End-to-End Project and Best Practices
- `assets/` - Shared CSS, JavaScript for navigation, audio, and piano widget (adapted from the music theory course)

## Features

- Mobile-first responsive design
- Dark, clean theme inspired by perthirtysix.com
- Interactive widgets (though audio-specific ones from music theory are retained; future work could replace with CV-specific interactives)
- Lesson completion tracking via localStorage
- Progress bar in the drawer
- Slide-out lesson drawer for navigation
- Mark lessons as complete by clicking the completion box at the bottom of each lesson

## Usage

Simply open `index.html` in a web browser. No server required.

## Adaptation Notes

This course was adapted from the music theory course by replacing content while keeping the same HTML structure, CSS, and JavaScript for navigation and state management. The audio.js file is included but not used in the CV lessons (it's harmless). Future iterations could replace the audio engine with computer vision interactive examples (e.g., using TensorFlow.js for in-browser demos).

## Customization

To adapt this course for another topic:
1. Replace the content in each lesson HTML file
2. Update the course title and emoji in the navigation bar
3. Update the TOTAL_LESSONS constant in assets/nav.js if changing the number of lessons
4. Optionally replace or remove assets/audio.js if not needed