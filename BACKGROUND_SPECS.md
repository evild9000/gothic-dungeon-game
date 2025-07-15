# Background Image Specifications

## Required Background Images

To complete the dynamic background system, you'll need to provide the following image files in the `images/backgrounds/` directory:

### **Image Specifications:**
- **Format:** JPG or PNG (JPG recommended for smaller file sizes)
- **Dimensions:** 1920x1080 pixels (16:9 aspect ratio) - will scale responsively
- **File Size:** Keep under 500KB each for optimal loading performance
- **Style:** Fantasy/medieval theme matching your gothic Diablo-style aesthetic

### **Image Optimization Guide:**

#### **Method 1: JPG Compression (Recommended)**
- **Format:** Use JPG for photographic/realistic backgrounds
- **Quality Setting:** 75-85% quality (sweet spot for size vs quality)
- **Tools:** 
  - **Photoshop:** File > Export > Export As > JPG (Quality: 8-9/12)
  - **GIMP:** File > Export As > JPG (Quality: 75-85)
  - **Online:** TinyJPG.com, Squoosh.app, or Compressor.io
- **Expected Size:** 200-400KB at 1920x1080

#### **Method 2: PNG with Optimization**
- **Format:** Use PNG only for images with transparency or very few colors
- **Tools:** 
  - **TinyPNG.com** (reduces PNG size by 50-70%)
  - **Photoshop:** File > Export > Export As > PNG (Smaller File)
  - **OptiPNG** or **PNGCrush** command line tools
- **Expected Size:** 300-500KB at 1920x1080

#### **Method 3: WebP Format (Modern Alternative)**
- **Format:** WebP offers 25-35% better compression than JPG
- **Quality Setting:** 80-90% quality
- **Tools:** 
  - **Squoosh.app** (Google's online tool)
  - **Photoshop 2021+** with WebP plugin
  - **Convertio.co** for batch conversion
- **Expected Size:** 150-300KB at 1920x1080
- **Note:** Update file extensions in code from `.jpg` to `.webp`

#### **Pro Tips for Size Reduction:**

1. **Optimize Image Content:**
   - Use darker backgrounds (compress better)
   - Avoid high-contrast details in large areas
   - Reduce noise/grain in source images

2. **Smart Composition:**
   - Focus detail in center, blur edges slightly
   - Use gradients instead of complex textures where possible
   - Limit color palette (especially for dungeons)

3. **Batch Processing:**
   - Use **ImageOptim** (Mac) or **FileOptimizer** (Windows)
   - **Adobe Bridge** batch processing
   - **XnConvert** for bulk optimization

4. **Progressive JPG:**
   - Enable progressive encoding for smoother loading
   - Photoshop: Save for Web > Progressive checkbox

### **Required Images:**

#### 1. **Village Background**
- **Filename:** `village.jpg`
- **Description:** Pleasant medieval village scene with buildings, paths, maybe some NPCs in the background
- **Mood:** Welcoming, safe, civilized
- **Suggested Elements:** Stone buildings, cobblestone paths, market stalls, warm lighting

#### 2. **Dungeon Backgrounds (5 variations)**
- **Filenames:** 
  - `dungeon1.jpg` - Dark stone corridors
  - `dungeon2.jpg` - Cave/cavern setting
  - `dungeon3.jpg` - Underground tomb/crypt
  - `dungeon4.jpg` - Volcanic/lava dungeon
  - `dungeon5.jpg` - Ice/frozen dungeon
- **Description:** Dark, dangerous underground environments
- **Mood:** Threatening, mysterious, claustrophobic
- **Suggested Elements:** Stone walls, torches, shadows, architectural details

#### 3. **Shop Background**
- **Filename:** `shop.jpg`
- **Description:** Medieval merchant's shop interior
- **Mood:** Busy, commercial, well-stocked
- **Suggested Elements:** Shelves with goods, counters, warm lighting, merchant tools

#### 4. **Crafting Background**
- **Filename:** `crafting.jpg`
- **Description:** Blacksmith forge or craftsman's workshop
- **Mood:** Industrial, fiery, productive
- **Suggested Elements:** Forge fire, anvil, tools, hot metals, sparks

#### 5. **Recruitment Background**
- **Filename:** `recruitment.jpg`
- **Description:** Training grounds or military camp
- **Mood:** Organized, martial, preparatory
- **Suggested Elements:** Training dummies, weapon racks, banners, open fields

### **Implementation Notes:**

1. **Fallback Handling:** If images are missing, the system will gracefully fall back to CSS gradients
2. **Performance:** Images are loaded on-demand when backgrounds change
3. **Responsive:** Images will scale to fit different screen sizes while maintaining aspect ratio
4. **Smooth Transitions:** 1-second fade transition between different backgrounds

### **Testing:**
Place sample images in the backgrounds folder and test the system by:
1. Starting the game (should show village background)
2. Entering dungeon (should show random dungeon background)
3. Opening shop/crafting/recruitment (should show respective backgrounds)
4. Exiting back to village (should return to village background)

### **File Size Verification:**
- **Windows:** Right-click file > Properties > Size
- **Mac:** Get Info > Size
- **Online:** Upload to TinyJPG.com to see current and optimized sizes
- **Target:** All files should be under 500KB (512,000 bytes)

### **Quick Size Reduction Checklist:**
✅ **Start with 1920x1080 source image**
✅ **Export as JPG with 75-85% quality**
✅ **Run through TinyJPG.com or similar optimizer**
✅ **Verify file size is under 500KB**
✅ **Test image quality in browser**
✅ **Adjust quality if needed (lower = smaller file)**

### **Alternative Approach - Smaller Base Resolution:**
If 500KB is still difficult to achieve:
- **Create at 1600x900** then upscale with CSS (90% of quality, 70% of file size)
- **Create at 1280x720** then upscale with CSS (80% of quality, 50% of file size)
- Browser scaling will handle the upscaling smoothly

### **🔄 Easy JPG to WebP Conversion:**

#### **Method 1: Online Converters (Easiest)**
1. **Squoosh.app** (Google's tool - RECOMMENDED)
   - Visit squoosh.app
   - Drag your JPG file to the browser
   - Select "WebP" from the right panel
   - Adjust quality (80-90% recommended)
   - Click "Download" - done!

2. **Convertio.co**
   - Upload JPG files (supports batch conversion)
   - Select WebP as output format
   - Download converted files

3. **CloudConvert.com**
   - Free tier: 25 conversions per day
   - Supports batch processing
   - High quality conversion

#### **Method 2: Desktop Software**
1. **XnConvert** (Free, Cross-platform)
   - Download from xnview.com
   - Add your JPG files
   - Set output format to WebP
   - Batch convert multiple files at once

2. **IrfanView** (Windows, Free)
   - Install WebP plugin
   - Open JPG > Save As > WebP
   - Adjust quality settings

#### **Method 3: Command Line (Advanced)**
**Windows:**
```bash
# Install Google's cwebp tool
# Download from: developers.google.com/speed/webp/download
cwebp -q 85 input.jpg -o output.webp
```

**Mac (with Homebrew):**
```bash
brew install webp
cwebp -q 85 input.jpg -o output.webp
```

#### **Method 4: Photoshop Plugin**
- Install WebP plugin for Photoshop 2021+
- File > Export > Export As > WebP
- Adjust quality slider (80-90%)

#### **Quick Batch Conversion Script:**
For multiple files, use Squoosh.app:
1. Open squoosh.app
2. Drag ALL your JPG files at once
3. Set WebP format and quality for first image
4. Use "Apply to all" button
5. Download all converted files as ZIP

**💡 Recommended:** Start with **Squoosh.app** - it's free, browser-based, shows real-time file size comparisons, and requires no software installation!

### **Optional Enhancements:**
- Add seasonal variations (village_spring.jpg, village_winter.jpg, etc.)
- Include animated elements (can be achieved with CSS animations over static images)
- Add weather effects (rain, snow overlays)

The system is designed to be easily expandable - just add more images to the backgrounds folder and update the background arrays in the code as needed.
