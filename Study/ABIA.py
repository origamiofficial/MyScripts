import pandas as pd
import chardet
import os
import re

# ======== HARD-CODED FILE PATHS ========
JOB_SKILLS_PATH = r"./job_skills.csv"
JOB_SUMMARY_PATH = r"./job_summary.csv"
LINKEDIN_POSTINGS_PATH = r"./linkedin_job_postings.csv"
COMBINED_PATH = r"./combined_job_data.csv"
ANALYST_PATH = r"./business_analyst_job_data.csv"
# =======================================

def show_menu():
    print("""
##################################
#### ABIA Raw Data Processing ####
####              Version 4.0 ####
##################################
1. Combine All CSVs
2. Extract Business Analyst Jobs
3. Do Both [1 & 2]
4. Extract by Location [Business Analyst]
5. Exit
##################################
    """)

def detect_encoding(file_path):
    """Detect file encoding using chardet"""
    with open(file_path, 'rb') as f:
        result = chardet.detect(f.read())
    return result['encoding']

def read_csv_with_retry(file_path):
    """Read CSV with automatic encoding detection and fallback"""
    try:
        encoding = detect_encoding(file_path)
        print(f"Detected encoding {encoding} for {file_path}")
        return pd.read_csv(file_path, encoding=encoding)
    except Exception as e:
        print(f"Error reading {file_path} with {encoding}: {str(e)}")
        print("Trying fallback encodings...")
        for enc in ['latin1', 'ISO-8859-1', 'cp1252', 'utf-16']:
            try:
                return pd.read_csv(file_path, encoding=enc)
            except:
                continue
        raise ValueError(f"Failed to read {file_path} with all encodings")

def combine_csvs():
    """Combine all CSV files into one dataset"""
    try:
        print("\n[1/3] Loading source files...")
        skills_df = read_csv_with_retry(JOB_SKILLS_PATH)
        summary_df = read_csv_with_retry(JOB_SUMMARY_PATH)
        postings_df = read_csv_with_retry(LINKEDIN_POSTINGS_PATH)
        
        print("\n[2/3] Merging data...")
        total_jobs = len(skills_df)
        merged_df = []
        
        for i, (_, row) in enumerate(skills_df.iterrows(), 1):
            job_link = row['job_link']
            print(f"Merging {i}/{total_jobs} ({i/total_jobs:.1%}): {job_link[:50]}...", end='\r', flush=True)
            
            merged_row = row.to_frame().T.merge(
                summary_df[summary_df['job_link'] == job_link],
                on="job_link",
                how="inner"
            )
            
            if not merged_row.empty:
                final_row = merged_row.merge(
                    postings_df[postings_df['job_link'] == job_link],
                    on="job_link",
                    how="inner"
                )
                if not final_row.empty:
                    merged_df.append(final_row)
        
        merged_df = pd.concat(merged_df, ignore_index=True)
        cleaned_df = merged_df.dropna().drop_duplicates("job_link")
        
        print("\n[3/3] Saving combined data...")
        cleaned_df.to_csv(COMBINED_PATH, index=False, encoding='utf-8')
        print(f"\n✅ Combined {len(cleaned_df)} jobs saved to {COMBINED_PATH}")
        return True
        
    except Exception as e:
        print(f"\n❌ Combination failed: {str(e)}")
        return False

def extract_business_analyst():
    """Extract Business Analyst roles from combined data"""
    try:
        if not os.path.exists(COMBINED_PATH):
            print("\n❌ Combined file not found! Run option 1 first.")
            return False
        
        print("\nLoading combined data...")
        df = pd.read_csv(COMBINED_PATH)
        
        print("\nFiltering Business Analyst roles...")
        analyst_rows = []
        total = len(df)
        
        for i, row in df.iterrows():
            title = str(row.get('job_title', '')).lower()
            print(f"Checking {i+1}/{total} ({((i+1)/total):.1%}): {title[:50]}...", end='\r', flush=True)
            
            if 'business analyst' in title:
                analyst_rows.append(row)
        
        if not analyst_rows:
            print("\n❌ No Business Analyst roles found!")
            return False
            
        analyst_df = pd.DataFrame(analyst_rows)
        analyst_df.to_csv(ANALYST_PATH, index=False, encoding='utf-8')
        print(f"\n✅ Found {len(analyst_df)} Business Analyst roles saved to {ANALYST_PATH}")
        return True
        
    except Exception as e:
        print(f"\n❌ Extraction failed: {str(e)}")
        return False

def extract_location_jobs():
    """Extract jobs matching specific location criteria"""
    try:
        if not os.path.exists(ANALYST_PATH):
            print("\n❌ Business Analyst data not found! Run option 2 or 3 first.")
            return False
        
        location = input("\nEnter location to search: ").strip()
        if not location:
            print("\n❌ No location entered!")
            return False
        
        print(f"\nLoading Business Analyst data...")
        df = pd.read_csv(ANALYST_PATH)
        
        print(f"\nSearching for '{location}' in job locations...")
        matched_rows = []
        total = len(df)
        
        # Split search terms and normalize
        search_terms = [term.strip().lower() for term in location.split(',')]
        
        for i, row in df.iterrows():
            job_loc = str(row.get('job_location', '')).lower()
            loc_parts = [part.strip() for part in job_loc.split(',')]
            
            # Check if all search terms exist in location parts
            match = all(term in loc_parts for term in search_terms)
            
            print(f"Checking {i+1}/{total} ({((i+1)/total):.1%}): {job_loc[:50]}...", end='\r', flush=True)
            
            if match:
                matched_rows.append(row)
        
        if not matched_rows:
            print(f"\n❌ No jobs found matching '{location}'")
            return False
            
        location_df = pd.DataFrame(matched_rows)
        
        # Clean filename
        clean_location = re.sub(r'[\\/*?:"<>|,]', '_', location)
        filename = f"{clean_location.replace(' ', '_')}_job_data.csv"
        
        location_df.to_csv(filename, index=False, encoding='utf-8')
        print(f"\n✅ Found {len(location_df)} jobs matching '{location}'")
        print(f"📁 Saved to: {filename}")
        return True
        
    except Exception as e:
        print(f"\n❌ Location extraction failed: {str(e)}")
        return False

def main():
    while True:
        show_menu()
        choice = input("Select Your Option [1-5]: ").strip()
        
        if choice == '1':
            combine_csvs()
        elif choice == '2':
            extract_business_analyst()
        elif choice == '3':
            if combine_csvs():
                extract_business_analyst()
        elif choice == '4':
            extract_location_jobs()
        elif choice == '5':
            print("\nExiting...")
            break
        else:
            print("\n❌ Invalid choice! Please select 1-5")
        
        input("\nPress Enter to continue...")

if __name__ == "__main__":
    main()