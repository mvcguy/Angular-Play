import { Injectable } from "@angular/core";

@Injectable()
export class PlayChatSound {

  audio = new Audio();
  fileLoaded = false;

  load(src: string) {
    this.audio.src = src;
    this.audio.load();
    this.fileLoaded = true;
  }

  play(path: string) {
    if (!this.fileLoaded) {
      this.load(path);
    }
    this.audio.play();
  }
}
