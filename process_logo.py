import sys
from PIL import Image

def process_image(input_path, out_dark, out_light):
    try:
        img = Image.open(input_path).convert("RGBA")
    except Exception as e:
        print(f"Failed to open {input_path}: {e}")
        return

    data = img.getdata()
    
    # 1. Make white background transparent
    newData = []
    # Using a threshold to catch near-white pixels from anti-aliasing
    threshold = 240
    for item in data:
        # item is (R, G, B, A)
        r, g, b, a = item
        # If it's mostly white and opaque
        if r > threshold and g > threshold and b > threshold:
            newData.append((255, 255, 255, 0))
        else:
            # Let's keep the dark color but ensure we blend edges properly
            # For anti-aliasing, we map the lightness to alpha
            # and set the color to the dark blue (or whatever it is)
            
            # Simple approach: keep original pixel if it's dark
            newData.append(item)
            
    img.putdata(newData)
    
    # 2. Crop to bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    # Save the dark version (for light mode)
    img.save(out_dark)
    print(f"Saved {out_dark}")
    
    # 3. Create a white version (for dark mode)
    whiteData = []
    for item in img.getdata():
        r, g, b, a = item
        if a > 0:
            # If it's partially transparent, keep alpha, but make it white
            # Actually, to properly handle anti-aliasing against white background,
            # originally the line was e.g. RGB(0,64,108) alpha=255 blended with white(255,255,255).
            # If a pixel was, say, RGB(128,192,210), it was 50% line and 50% white.
            # A better algorithm:
            # luminance of original pixel determines the alpha of the new image!
            # Since the original background is white (255) and line is dark blue (approx 0 luminance).
            pass
        whiteData.append(item) # fallback

    # Let's do a better alpha extraction:
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    dark_data = []
    white_data = []
    
    # Let's say the line color is approx #00406c (0, 64, 108)
    line_r, line_g, line_b = 0, 64, 108
    
    for item in data:
        r, g, b, a = item
        # Calculate grayscale / brightness (0 to 255)
        bright = (r * 299 + g * 587 + b * 114) // 1000
        
        # If brightness is 255, it's fully background -> alpha = 0.
        # If brightness is 0, it's fully foreground -> alpha = 255.
        alpha = 255 - bright
        
        # Adjust alpha curve to not lose faint lines
        if alpha < 15:
            alpha = 0
            
        dark_data.append((line_r, line_g, line_b, alpha))
        white_data.append((255, 255, 255, alpha))
        
    img_dark = Image.new("RGBA", img.size)
    img_dark.putdata(dark_data)
    img_dark = img_dark.crop(img_dark.getbbox() or (0,0,img.width,img.height))
    img_dark.save(out_dark)
    print(f"Saved {out_dark} with enhanced alpha mask")

    img_white = Image.new("RGBA", img.size)
    img_white.putdata(white_data)
    img_white = img_white.crop(img_white.getbbox() or (0,0,img.width,img.height))
    img_white.save(out_light)
    print(f"Saved {out_light} with enhanced alpha mask")

if __name__ == "__main__":
    process_image("DECA-DEXLOGO.png", "public/logo.png", "public/logo-white.png")
