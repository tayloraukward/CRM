export type Organization = {
  id: number;
  name: string;
  website: string | null;
  created_at: string;
};

export type Contact = {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  organization_id: number | null;
  created_at: string;
};

export type Deal = {
  id: number;
  title: string;
  amount: string;
  stage: string;
  organization_id: number | null;
  contact_id: number | null;
  created_at: string;
};
