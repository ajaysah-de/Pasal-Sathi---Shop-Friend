import subprocess
import os

# Icon sizes needed for PWA
sizes = [72, 96, 128, 144, 152, 192, 384, 512]

# Check if we have imagemagick or use a simple approach
for size in sizes:
    # Create a simple colored PNG using Python
    try:
        from PIL import Image, ImageDraw
        
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Draw rounded rectangle background
        radius = size // 5
        draw.rounded_rectangle([0, 0, size-1, size-1], radius=radius, fill='#8B0000')
        
        # Draw shop icon (simplified)
        center = size // 2
        scale = size / 512
        
        # Roof
        roof_points = [
            (center - 120*scale, center - 60*scale),
            (center, center - 120*scale),
            (center + 120*scale, center - 60*scale)
        ]
        draw.line(roof_points, fill='white', width=max(2, int(20*scale)))
        
        # Walls
        wall_points = [
            (center - 100*scale, center - 60*scale),
            (center - 100*scale, center + 80*scale),
            (center + 100*scale, center + 80*scale),
            (center + 100*scale, center - 60*scale)
        ]
        draw.line(wall_points, fill='white', width=max(2, int(20*scale)))
        
        # Door
        door_x = center - 30*scale
        door_y = center + 10*scale
        door_w = 60*scale
        door_h = 70*scale
        draw.rounded_rectangle([door_x, door_y, door_x+door_w, door_y+door_h], 
                               radius=max(1, int(8*scale)), fill='white')
        
        img.save(f'icon-{size}x{size}.png', 'PNG')
        print(f'Created icon-{size}x{size}.png')
    except ImportError:
        print('PIL not available, creating placeholder')
        break

print('Done generating icons!')
