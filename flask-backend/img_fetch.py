from bing_image_downloader import downloader
import os

def download_images(query, limit=1, output_dir='downloaded_images'):
    """
    Downloads images based on a search query.

    :param query: Search query for images
    :param limit: Number of images to download
    :param output_dir: Directory to save downloaded images
    """
    try:
        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Download images
      
        downloader.download(query, limit=limit, output_dir=output_dir, adult_filter_off=True, force_replace=False, timeout=60)
       
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    # Take user input
    text = input("Enter the text to search images for: ")
    num_images = 1
    
    # Call the function
    download_images(text, limit=num_images)
