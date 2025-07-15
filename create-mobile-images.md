# Create Mobile-Optimized Background Images

## Problem: Images too large for mobile devices
Your Samsung Galaxy S22 may struggle with the larger images. We need smaller versions.

## Target Mobile Specs:
- **Screen**: 2340 x 1080 pixels (Samsung Galaxy S22)
- **CSS Viewport**: ~412 x 915 pixels
- **Target Image Size**: 800 x 450 pixels (much smaller)
- **File Size**: Under 50KB each for mobile

## Quick Solution: Use Squoosh.app

### Step 1: Open Squoosh.app
1. Go to **https://squoosh.app** in your browser
2. This will resize and compress your images

### Step 2: Process Each Image
For each image in `images/backgrounds/`:

1. **Drag image** to Squoosh
2. **Set output size**: 800 x 450 pixels (left panel)
3. **Choose WebP format** (right panel)
4. **Set quality**: 60-70% (for mobile)
5. **Download** the compressed image
6. **Save to**: `images/backgrounds/mobile/[filename].webp`

### Step 3: Batch Process (Faster)
1. Open multiple browser tabs with Squoosh.app
2. Process 2-3 images simultaneously
3. Download all compressed versions

## Expected Results:
- **Original**: 150-250KB each
- **Mobile**: 25-50KB each (5x smaller!)
- **Quality**: Still good for mobile screens

## Files to Process:
- village.webp → mobile/village.webp
- dungeon1.webp → mobile/dungeon1.webp  
- dungeon2.webp → mobile/dungeon2.webp
- dungeon3.webp → mobile/dungeon3.webp
- dungeon4.webp → mobile/dungeon4.webp
- dungeon5.webp → mobile/dungeon5.webp
- shop.webp → mobile/shop.webp
- crafting.webp → mobile/crafting.webp
- recruitment.webp → mobile/recruitment.webp

## Test Mobile Performance:
After creating mobile images:
1. Push updated code to GitHub
2. Test on Samsung Galaxy S22
3. Images should load much faster
4. Background switching should be smoother

## Alternative: CSS-Only Solution
If you want to skip creating mobile images, I can modify the code to disable background images on mobile and use only CSS gradients, which would be even faster.
