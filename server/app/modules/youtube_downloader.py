import os
from pytube import YouTube
from pytube.exceptions import VideoUnavailable
from moviepy.video.io.ffmpeg_tools import ffmpeg_extract_subclip

def get_available_resolutions(yt):
    resolutions = set()
    for stream in yt.streams.filter(file_extension='mp4'):
        if stream.resolution:
            resolutions.add(stream.resolution)
    return sorted(resolutions, key=lambda x: int(x[:-1]) if x[-1] == 'p' else 0)

def download_video(url, resolution, start_time=None, end_time=None):
    try:
        yt = YouTube(url)
        print(f"Downloading: {yt.title}")

        # Выбор потока с нужным разрешением
        stream = yt.streams.filter(res=resolution, file_extension='mp4').first()
        if not stream:
            print(f"Resolution {resolution} not available.")
            return

        # Скачивание видео
        video_path = stream.download()
        print(f"Downloaded: {video_path}")

        if start_time is not None and end_time is not None:
            # Создание клипа
            output_path = f"{os.path.splitext(video_path)[0]}_clip.mp4"
            ffmpeg_extract_subclip(video_path, start_time, end_time, targetname=output_path)
            print(f"Clip created: {output_path}")

            # Удаление исходного видео
            os.remove(video_path)
            print(f"Original video deleted: {video_path}")
        else:
            print(f"Video saved: {video_path}")
    except VideoUnavailable as e:
        print(f"Video is unavailable: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    url = input("Enter YouTube video URL: ")
    try:
        yt = YouTube(url)
    except Exception as e:
        print(f"An error occurred while fetching video information: {e}")
        exit()

    available_resolutions = get_available_resolutions(yt)
    print("Available resolutions:")
    for i, res in enumerate(available_resolutions, start=1):
        print(f"{i}. {res}")

    choice = int(input("Enter the number of the desired resolution: "))
    if 1 <= choice <= len(available_resolutions):
        resolution = available_resolutions[choice - 1]
    else:
        print("Invalid choice.")
        exit()

    create_clip = input("Do you want to create a clip? (yes/no): ").lower() == 'yes'

    start_time = None
    end_time = None

    if create_clip:
        start_time = input("Enter start time (in seconds): ")
        end_time = input("Enter end time (in seconds): ")
        start_time = int(start_time)
        end_time = int(end_time)

    download_video(url, resolution, start_time, end_time)
