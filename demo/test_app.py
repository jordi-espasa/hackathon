import cv2
import numpy as np

def draw_color_overlay(frame, input_points):
    # Get frame dimensions
    height, width = frame.shape[:2]
    
    # Create color overlay
    overlay = np.zeros_like(frame)
    
    # Interpolate colors between input points
    for x in range(width):
        # Find the two closest input points
        left_point = None
        right_point = None
        
        for i in range(len(input_points)):
            if input_points[i][0] <= x:
                left_point = input_points[i]
            if input_points[i][0] > x and right_point is None:
                right_point = input_points[i]
                
        # Handle edge cases
        if left_point is None:
            left_point = input_points[0]
        if right_point is None:
            right_point = input_points[-1]
            
        # Interpolate value
        x1, v1 = left_point
        x2, v2 = right_point
        if x1 == x2:
            value = v1
        else:
            value = v1 + (v2 - v1) * (x - x1) / (x2 - x1)
            
        # Convert value to color (0=green, 10=red)
        value = max(0, min(10, value)) # Clamp between 0-10
        r = int((value / 10) * 255)    # Red increases with value
        g = int((1 - value / 10) * 255) # Green decreases with value
        b = 0                           # No blue component
        
        overlay[:, x] = [b, g, r]  # BGR format for OpenCV
        
    # Blend original frame with color overlay
    alpha = 0.3  # Transparency factor
    return cv2.addWeighted(frame, 1-alpha, overlay, alpha, 0)

def open_camera():
    # Initialize video capture from default camera (usually 0)
    cap = cv2.VideoCapture(2)
    
    # Define input points (x coordinate, value from 0-10)
    input_points = [
        (100, 1),   # x=100, value=2 
        (300, 10),   # x=300, value=5
        (500, 10),   # x=500, value=8
        (640, 1)    # x=700, value=3
    ]
    
    if not cap.isOpened():
        print("Error: Could not open camera")
        return
        
    # Get camera resolution
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"Camera resolution - Width: {width}, Height: {height}")
    print(f"X-axis range - Min: 0, Max: {width}")
        
    while True:
        # Capture frame-by-frame
        ret, frame = cap.read()
        
        if not ret:
            print("Error: Can't receive frame")
            break
            
        # Draw color overlay on frame
        frame = draw_color_overlay(frame, input_points)
            
        # Display the frame
        cv2.imshow('Camera Feed', frame)
        
        # Press 'q' to quit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    # Release everything when done
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    open_camera()
