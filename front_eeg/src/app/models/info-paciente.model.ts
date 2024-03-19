import { Consulta } from "./consulta";

export class InfoPaciente {
    // Personal Information
    internalId?: string;
    firstName?: string;
    lastName?: string;
    surname?: string;
    birthDate?: Date;
    gender?: 'male' | 'female';
    civilStatus?: 'single' | 'married' | 'divorced' | 'widowed';
    educationLevel?: string;
    occupation?: string;

    //Contact Information
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;

    //Health Information
    medicalHistory?: string;
    currentMedications: string[] = [];
    consultations?: Consulta[] = [];

    //Emergency Contact
    relativeFirstName?: string;
    relativeLastName?: string;
    relativeSurname?: string;
    relativeRelationship?: string;
    relativePhone?: string;
    relativeEmail?: string;
    relativeAddress?: string;
    relativeCity?: string;
    relativeState?: string;
    relativeZipCode?: string;
    relativeCountry?: string;
    relativeNotes?: string;

    //Consent
    consent?: boolean;
}

