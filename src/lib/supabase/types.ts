
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "applications": {
                  Row: {
                    "answered_on": string | null,"applied_on": string | null,"channel": Database["public"]['Enums']["application_channel"],"city": string | null,"company": string,"contact_email": string | null,"contact_name": string | null,"country": string | null,"created_at": string,"cv_id": string | null,"duration_months": number | null,"feedback": string | null,"follow_up_on": string | null,"id": string,"notes": string | null,"number": number,"role": string,"start_on": string | null,"status": Database["public"]['Enums']["application_status"],"type": Database["public"]['Enums']["internship_type"],"updated_at": string,"url": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answered_on"?: string | null,"applied_on"?: string | null,"channel"?: Database["public"]['Enums']["application_channel"],"city"?: string | null,"company": string,"contact_email"?: string | null,"contact_name"?: string | null,"country"?: string | null,"created_at"?: string,"cv_id"?: string | null,"duration_months"?: number | null,"feedback"?: string | null,"follow_up_on"?: string | null,"id"?: string,"notes"?: string | null,"number"?: number,"role": string,"start_on"?: string | null,"status"?: Database["public"]['Enums']["application_status"],"type"?: Database["public"]['Enums']["internship_type"],"updated_at"?: string,"url"?: string | null,"user_id"?: string
                  }
                  Update: {
                    "answered_on"?: string | null,"applied_on"?: string | null,"channel"?: Database["public"]['Enums']["application_channel"],"city"?: string | null,"company"?: string,"contact_email"?: string | null,"contact_name"?: string | null,"country"?: string | null,"created_at"?: string,"cv_id"?: string | null,"duration_months"?: number | null,"feedback"?: string | null,"follow_up_on"?: string | null,"id"?: string,"notes"?: string | null,"number"?: number,"role"?: string,"start_on"?: string | null,"status"?: Database["public"]['Enums']["application_status"],"type"?: Database["public"]['Enums']["internship_type"],"updated_at"?: string,"url"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "applications_cv_id_fkey"
      columns: ["cv_id"]
isOneToOne: false
      referencedRelation: "cvs"
      referencedColumns: ["id"]
    }
                  ]
                },"cvs": {
                  Row: {
                    "archived": boolean,"created_at": string,"file_name": string | null,"file_path": string | null,"file_size": number | null,"id": string,"label": string,"language": string,"notes": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived"?: boolean,"created_at"?: string,"file_name"?: string | null,"file_path"?: string | null,"file_size"?: number | null,"id"?: string,"label": string,"language"?: string,"notes"?: string | null,"user_id"?: string
                  }
                  Update: {
                    "archived"?: boolean,"created_at"?: string,"file_name"?: string | null,"file_path"?: string | null,"file_size"?: number | null,"id"?: string,"label"?: string,"language"?: string,"notes"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"status_events": {
                  Row: {
                    "application_id": string,"at": string,"id": number,"status": Database["public"]['Enums']["application_status"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id": string,"at"?: string,"id"?: never,"status": Database["public"]['Enums']["application_status"],"user_id": string
                  }
                  Update: {
                    "application_id"?: string,"at"?: string,"id"?: never,"status"?: Database["public"]['Enums']["application_status"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "status_events_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            "application_channel": "job_board"|"linkedin"|"company_site"|"school"|"referral"|"cold_email"|"lab_site"|"other","application_status": "to_apply"|"applied"|"followed_up"|"interview"|"offer"|"rejected"|"no_answer"|"withdrawn","internship_type": "abroad"|"research"|"startup"|"large_company"|"public_sector"|"nonprofit"|"other"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "application_channel": ["job_board", "linkedin", "company_site", "school", "referral", "cold_email", "lab_site", "other"],"application_status": ["to_apply", "applied", "followed_up", "interview", "offer", "rejected", "no_answer", "withdrawn"],"internship_type": ["abroad", "research", "startup", "large_company", "public_sector", "nonprofit", "other"]
          }
        }
} as const
