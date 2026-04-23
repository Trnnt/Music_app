const fs = require('fs');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

try {
  const jpegData = fs.readFileSync('assets/images/splash.png');
  const rawData = jpeg.decode(jpegData);
  
  const png = new PNG({
    width: rawData.width,
    height: rawData.height
  });
  png.data = rawData.data;
  
  const buffer = PNG.sync.write(png);
  fs.writeFileSync('assets/images/splash.png', buffer);
  console.log('Successfully converted splash.png to real PNG format.');
} catch (err) {
  console.error('Failed to convert image:', err);
  process.exit(1);
}
