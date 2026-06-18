import sys
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.pipeline_options import PdfPipelineOptions, TableFormerMode
from docling.datamodel.base_models import InputFormat

def extract_markdown(image_path: str):
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
        result = doc_converter.convert(image_path)
        print(result.document.export_to_markdown())
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python docling_helper.py <image_path>", file=sys.stderr)
        sys.exit(1)
        
    extract_markdown(sys.argv[1])
