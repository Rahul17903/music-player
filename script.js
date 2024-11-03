let currentSong = new Audio();
let songs = [];
let currFolder = '';

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    try {
        let response = await fetch(`/${folder}/`);
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");
        songs = [];

        for (let element of as) {
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href.split(`/${folder}/`)[1]);
            }
        }

        if (songs.length === 0) {
            console.warn(`No songs found in ${folder}`);
        }

        let songUL = document.querySelector(".songList ul");
        songUL.innerHTML = "";

        for (const song of songs) {
            songUL.innerHTML += `<li><img class="invert" width="34" src="img/music.svg" alt="">
                                  <div class="info"><div>${song.replaceAll("%20", " ")}</div><div>rahul</div></div>
                                  <div class="playnow"><span>Play Now</span><img class="invert" src="img/play.svg" alt=""></div>
                                 </li>`;
        }

        Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
            e.addEventListener("click", () => {
                playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
            });
        });

    } catch (error) {
        console.error("Error fetching songs:", error);
    }

    return songs;
}

const playMusic = (track, pause = false) => {
    if (!track) {
        console.error("No track provided to play.");
        return;
    }
    
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    try {
        let response = await fetch(`/spotify/songs/`);
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");
        cardContainer.innerHTML = "";

        let array = Array.from(anchors);
        for (let e of array) {
            if (e.href.includes("spotify/songs")) {
                let folder = e.pathname.split("/").slice(-1)[0].trim();
                let albumData = await fetch(`/spotify/songs/${folder}/info.json`);
                
                if (albumData.ok) {
                    let albumInfo = await albumData.json();
                    cardContainer.innerHTML += `<div class="card" data-folder="${folder}">
                                                    <div class="play"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"/></svg></div>
                                                    <img src="/spotify/songs/${folder}/cover.jpg" alt="Album cover">
                                                    <h2>${albumInfo.title}</h2><p>${albumInfo.description}</p>
                                                 </div>`;
                } else {
                    console.error("Error fetching album metadata:", albumData.status);
                }
            }
        }

        Array.from(document.getElementsByClassName("card")).forEach(card => {
            card.addEventListener("click", async event => {
                let folder = event.currentTarget.dataset.folder;
                songs = await getSongs(`spotify/songs/${folder}`);
                if (songs.length > 0) {
                    playMusic(songs[0]);
                } else {
                    console.warn("No songs available to play in this album.");
                }
            });
        });
    } catch (error) {
        console.error("Error displaying albums:", error);
    }
}

async function main() {
    try {
        songs = await getSongs(`spotify/songs/arijitsong`);
        if (songs.length > 0) {
            playMusic(songs[0], true);
        } else {
            console.warn("No songs found in initial folder.");
        }

        await displayAlbums();
        
        // Event listener setup for play, previous, and next buttons
        const play = document.getElementById("play");
        const previous = document.getElementById("previous");
        const next = document.getElementById("next");
        // Listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    })

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100
    })

    // Add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })

    // Add an event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"
    })
        // Add an event to volume
        document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
            console.log("Setting volume to", e.target.value, "/ 100")
            currentSong.volume = parseInt(e.target.value) / 100
            if (currentSong.volume >0){
                document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg")
            }
        })
    
        // Add event listener to mute the track
        document.querySelector(".volume>img").addEventListener("click", e=>{ 
            if(e.target.src.includes("volume.svg")){
                e.target.src = e.target.src.replace("volume.svg", "mute.svg")
                currentSong.volume = 0;
                document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
            }
            else{
                e.target.src = e.target.src.replace("mute.svg", "volume.svg")
                currentSong.volume = .10;
                document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
            }
    
        })

        play.addEventListener("click", () => {
            if (currentSong.paused) {
                currentSong.play();
                play.src = "img/pause.svg";
            } else {
                currentSong.pause();
                play.src = "img/play.svg";
            }
        });

        previous.addEventListener("click", () => {
            let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
            if (index > 0) {
                playMusic(songs[index - 1]);
            }
        });

        next.addEventListener("click", () => {
            let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
            if (index < songs.length - 1) {
                playMusic(songs[index + 1]);
            }
        });
    } catch (error) {
        console.error("Error initializing music player:", error);
    }
}

// Initialize the player
main();
