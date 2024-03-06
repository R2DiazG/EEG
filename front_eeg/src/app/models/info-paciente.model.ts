export class InfoPaciente {
    internalId?: string;
    firstName?: string;
    lastName?: string;
    surname?: string;
    birthDate?: Date;
    gender?: 'male' | 'female';
    civilStatus?: 'single' | 'married' | 'divorced' | 'widowed';
    educationLevel?: string;
    occupation?: string;
    medicalHistory?: string;
    currentMedications?: string[];
    consultationDate?: Date;
    consultationNumber?: string;
    previousDiagnosis?: string;
    relativeFirstName?: string;
    relativeLastName?: string;
    relativeSurname?: string;
    consent?: boolean;
}
