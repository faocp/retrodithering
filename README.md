# Atkinson Dithering App

This is a simple web application that converts images to black and white using the Atkinson dithering algorithm. This creates a distinctive, high-contrast look that's reminiscent of early computer graphics. Made to honour the late Bill Atkinson, legendary programmer.

## Features

- Upload any image file
- Real-time preview of original and dithered versions
- Download the dithered image
- Responsive design that works on both desktop and mobile
- Maximum image width of 800px to ensure good performance

## How to Use

1. Open `index.html` in a modern web browser
2. Click the "Choose an image" button to select an image file
3. The original and dithered versions will be displayed side by side
4. Click the "Download Dithered Image" button to save the result

## Technical Details

The app uses pure JavaScript and HTML5 Canvas for image processing. The Atkinson dithering algorithm is implemented with the following characteristics:

- Converts images to grayscale
- Uses a 3x3 error diffusion pattern
- Distributes error to neighboring pixels
- Produces a high-contrast black and white output

## Browser Support

This app works in all modern browsers that support HTML5 Canvas, including:
- Chrome
- Firefox
- Safari
- Edge

## License

MIT License - feel free to use and modify as needed. 