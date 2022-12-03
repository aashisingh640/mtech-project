import { Component, OnInit } from '@angular/core';
import { SharedService } from './../../services/shared.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent implements OnInit {

  uploadedFile: any;
  uploadedZipFile: any;

  showToast: boolean = false;
  toastMsg: string = '';
  toastVariant: string = '';

  constructor(private shared: SharedService) { }

  ngOnInit(): void {
  }

  onFileChange(event: any) {

    const file: File = event.target.files[0];
    const ext = file.name.toLowerCase().substr(file.name.lastIndexOf("."), file.name.length - 1);

    if (ext !== '.pdf') return;

    this.uploadedFile = file;

  }

  onZipFileChange(event: any) {

    const file: File = event.target.files[0];
    const ext = file.name.toLowerCase().substr(file.name.lastIndexOf("."), file.name.length - 1);

    if (ext !== '.zip') return;

    this.uploadedZipFile = file;

  }

  uploadPDF() {

    const formData: any = new FormData();
    formData.append("uploads[]", this.uploadedFile, this.uploadedFile.name);

    this.shared.setLoading();

    this.shared.uploadPDF(formData).subscribe({
      next: (v) => {
        console.log(v);
        this.uploadedFile = null;
        this.showToast = true;
        this.toastMsg = v.msg;
        this.toastVariant = 'success';
      },
      error: (e) => {
        console.log(e)
        this.shared.removeLoading();
        this.showToast = true;
        this.toastMsg = e.error.msg;
        this.toastVariant = 'error';

      },
      complete: () => {
        console.log('complete');
        this.shared.removeLoading();
      }
    })

  }

  uploadZip() {

    const formData: any = new FormData();
    formData.append("uploads[]", this.uploadedZipFile, this.uploadedZipFile.name);

    this.shared.setLoading();

    this.shared.uploadZip(formData).subscribe({
      next: (v) => {
        console.log(v);
        this.uploadedZipFile = null;
        this.showToast = true;
        this.toastMsg = v.msg;
        this.toastVariant = 'success';
      },
      error: (e) => {
        console.log(e)
        this.shared.removeLoading();
        this.showToast = true;
        this.toastMsg = e.error.msg;
        this.toastVariant = 'error';

      },
      complete: () => {
        console.log('complete');
        this.shared.removeLoading();
      }
    })

  }

}
