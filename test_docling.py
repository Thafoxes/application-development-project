# test_docling.py
# Example script to test Docling's table extraction locally.
# Before running:
# 1. Ensure Python 3.10+ is installed.
# 2. Run: pip install docling pandas
# 3. Usage: python test_docling.py path/to/timetable_image.jpg

import sys
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.pipeline_options import PdfPipelineOptions, TableFormerMode
from docling.datamodel.base_models import InputFormat

def extract_tables(image_path: str):
    # Configure pipeline options for better table structure recognition
    pipeline_options = PdfPipelineOptions(do_table_structure=True)
    pipeline_options.table_structure_options.mode = TableFormerMode.ACCURATE

    # Initialize the converter
    doc_converter = DocumentConverter(
        allowed_formats=[InputFormat.IMAGE],
        format_options={
            InputFormat.IMAGE: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )

    try:
        print(f"Processing image: {image_path}...")
        result = doc_converter.convert(image_path)
        
        # Export tables to markdown
        markdown_content = result.document.export_to_markdown()
        
        # Write to markdown.md file
        output_file = "docling_markdown.md"
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(markdown_content)
            
        print(f"\n[Success] Extracted markdown written to: {output_file}")
        
        print("\n=== Extraction Result (Markdown) ===")
        print(markdown_content)
        
        # Also print DataFrame if needed
        print("\n=== Extracted Tables (DataFrames) ===")
        for i, table in enumerate(result.document.tables):
            df = table.export_to_dataframe()
            print(f"\nTable {i + 1}:")
            print(df)
            
    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_docling.py <image_path>")
        sys.exit(1)
        
    image_path = sys.argv[1]
    extract_tables(image_path)
