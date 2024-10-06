import {FileUploader} from "react-drag-drop-files";

export interface EmailUploaderProps {
    onFilesUploaded: (files: FileList) => void;
}

export default function EmailUploader({onFilesUploaded}: EmailUploaderProps) {
    return <FileUploader handleChange={onFilesUploaded} multiple name="file" />
}