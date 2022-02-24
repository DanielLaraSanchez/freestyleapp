import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WebsocketService } from './services/websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  client = {};
  remoteSocketId: any;
  peerConnection: any;
  socket;
  pairedPeerWaiting = false;
  sender: any;
  peerObject = {};
  words: string[] = [];
  sessionStorageData: any = sessionStorage.getItem('userDetails');
  userDetails: any = JSON.parse(this.sessionStorageData);

  constructor(public router: Router, public _webSocketService: WebsocketService) {
    this.socket = this._webSocketService.socket;
   }


  ngOnInit() {
    sessionStorage.setItem('userDetails', JSON.stringify({name: "dani"}))
    this.waitForInstructions();
    this.setNickNameOnLogin();
    // this.readyToBattle();

  }

  setNickNameOnLogin(){

    this.socket.emit('setnickname', Date.toString());
  }


  nextPage(){
    this.router.navigate([''])
  }


  waitForInstructions() {
    this.socket.on('onOffer', (senderId: any, words:any) => {
      console.log(words, "words")

      console.log('funciona on offer', senderId)
      this.onOffer(this.socket, this.userDetails);
    })

    this.socket.on('onSendOffer', (recieverId: any, words: any) => {
      console.log(words, "words")
      console.log('funciona sendOffer', recieverId)

      this.sendOffer(this.socket, recieverId, this.userDetails);
    })
  }

  onOffer(socket: any, userDetails: any) {
    let peerConnection = new RTCPeerConnection();
    let video = document.createElement('video');
    let div = document.getElementById('webCamCol1');
    video.height = 400;
    video.width = 400;
    video.style.objectFit = "cover";
    div?.appendChild(video);
    //////////////////////////////////////////////////
    let videoOtherPeer = document.createElement('video');
    videoOtherPeer.height = 400;
    videoOtherPeer.width = 400;
    videoOtherPeer.style.objectFit = "cover";

    let videoOtherPeerDiv = document.getElementById('webCamCol2');
    videoOtherPeerDiv?.appendChild(videoOtherPeer);
    var constraints = { audio: false, video: { width: 1280, height: 1720 } };
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
      video.srcObject = stream;
      video.play();
    }).catch(error => console.error(error));

    ///////////////////////////////////////////////////    var constraints = { audio: false, video: { width: 1280, height: 720 } };
    socket.on('offer',  (id: any, description: any, peerUserDetails: any) => {
      peerConnection.setRemoteDescription(description)
        .then(() => peerConnection.createAnswer())
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(function () {

          socket.emit('answer', id, peerConnection.localDescription, userDetails);
        });
      let stream = video.srcObject;

      (<MediaStream>stream).getTracks().forEach(track => {
        this.sender = peerConnection.addTrack(track, <MediaStream>stream)
      });

      peerConnection.ontrack = function (event) {
        videoOtherPeer.srcObject = event.streams[0];
        videoOtherPeer.play()
      };
      peerConnection.onicecandidate = function (event) {
        if (event.candidate) {
          socket.emit('candidate', id, event.candidate);
        }
      };
      let otherPeerWrapperDiv = document.getElementById('peerWrapper')
      let otherPeerH3 = document.createElement('h3');
      otherPeerH3.textContent = peerUserDetails.name;
      otherPeerH3.style.color = 'white'
      otherPeerWrapperDiv?.appendChild(otherPeerH3)
      let myWrapperDiv = document.getElementById('myWrapper')
      let myH3 = document.createElement('h3');
      myH3.textContent = userDetails.name;
      myH3.style.color = 'white'
      myWrapperDiv?.appendChild(myH3)
      this.peerObject = peerUserDetails;
      console.log(peerUserDetails)
    })

    socket.on('candidate', function (id: any, candidate: any) {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
        .catch(e => console.error(e));
    });
    socket.on('broadcaster', function () {
      socket.emit('watcher');
    });

    socket.on('bye',  () => {
      peerConnection.removeTrack(this.sender);
      peerConnection.close();
      peerConnection = new RTCPeerConnection();
      // peerConnection = undefined;
      video.hidden = true;
      videoOtherPeer.hidden = true;
      let stream = video.srcObject;
      (<MediaStream>stream).getTracks().forEach(track => {
        track.stop();
      });
      let otherPeerStream = videoOtherPeer.srcObject;
      (<MediaStream>otherPeerStream).getTracks().forEach(track => {
        track.stop();
      });
      socket.emit('imfree', socket.id)
      window.location.reload();
    });


  }
  sendOffer(socket: any, recieverId: any, userDetails: any) {
    let peerConnections: any = {};
    let peerConnection: any;
    let video = document.createElement('video');
    let div = document.getElementById('webCamCol1');
    video.height = 390;
    video.width = 425;
    video.style.objectFit = "cover";
    div?.appendChild(video);
    ///////////////////////////////////////
    let videoOtherPeer = document.createElement('video');
    videoOtherPeer.height = 390;
    videoOtherPeer.width = 425;
    videoOtherPeer.style.objectFit = "cover";
    let videoOtherPeerDiv = document.getElementById('webCamCol2');
    videoOtherPeerDiv?.appendChild(videoOtherPeer);
    if (Object.keys(peerConnections).length < 2) {
      var constraints = { audio: false, video: { width: 1280, height: 720 } };
      navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        video.srcObject = stream;
        video.play();
        socket.emit('broadcaster');
      }).catch(error => console.error(error));

      socket.on('answer',  (id: any, description: any, peerUserDetails: any) => {
        peerConnections[id].setRemoteDescription(description);
        this.peerObject = peerUserDetails;
        let otherPeerWrapperDiv = document.getElementById('peerWrapper')
        let otherPeerH3 = document.createElement('h3');
        otherPeerH3.textContent = peerUserDetails.name;
        otherPeerH3.style.color = 'white'
        otherPeerWrapperDiv?.appendChild(otherPeerH3)
        let myWrapperDiv = document.getElementById('myWrapper')
        let myH3 = document.createElement('h3');
        myH3.textContent = userDetails.name;
        myH3.style.color = 'white'
        myWrapperDiv?.appendChild(myH3)
        console.log(peerUserDetails)
      });


      socket.on('watcher',  () => {
        peerConnection = new RTCPeerConnection();
        peerConnections[recieverId] = peerConnection;
        let stream = video.srcObject;
        (<MediaStream>stream).getTracks().forEach(track => {
          this.sender = peerConnection.addTrack(track, <MediaStream>stream)
        });
        peerConnection.createOffer().then((sdp: any) => peerConnection.setLocalDescription(sdp)).then(function () {
          console.log(userDetails)
          socket.emit('offer', recieverId, peerConnection.localDescription, userDetails );
        });
        peerConnection.onicecandidate = function (event: any) {
          if (event.candidate) {
            socket.emit('candidate', recieverId, event.candidate);
          }
        };

        peerConnection.ontrack = function (event: any) {
          videoOtherPeer.srcObject = event.streams[0];
          videoOtherPeer.play()
        };
      });

      socket.on('candidate', function (id: any, candidate: any) {
        peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
      });
      socket.on('bye',  (id: any) => {
        peerConnection.removeTrack(this.sender)
        peerConnection.close();
        peerConnection = new RTCPeerConnection();
        peerConnections = {}
        delete peerConnections[id];
        video.hidden = true;
        videoOtherPeer.hidden = true;
        let stream = video.srcObject;
        (<MediaStream>stream).getTracks().forEach(track => {
          track.stop();
        });
        let otherPeerStream = videoOtherPeer.srcObject;
        (<MediaStream>otherPeerStream).getTracks().forEach(track => {
          track.stop();
        });
        socket.emit('imfree', socket.id)
        window.location.reload();
      });
    }
  }


  readyToBattle() {
    this.socket.emit('readyToBattle', this._webSocketService.socket.id)

  }

  createNamesInPage(userDetails: any, peerUserDetails: any){
    let otherPeerWrapperDiv = document.getElementById('peerWrapper')
        let otherPeerH3 = document.createElement('h3');
        otherPeerH3.textContent = peerUserDetails.name;
        otherPeerH3.style.color = 'white'
        otherPeerWrapperDiv?.appendChild(otherPeerH3)
        let myWrapperDiv = document.getElementById('myWrapper')
        let myH3 = document.createElement('h3');
        myH3.textContent = userDetails.name;
        myH3.style.color = 'white'
        myWrapperDiv?.appendChild(myH3)
        this.peerObject = peerUserDetails;
  }



}
