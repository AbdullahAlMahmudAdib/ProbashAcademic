.PHONY: all clean view

TEX = main.tex
PDF = main.pdf
BIB = references.bib

all: $(PDF)

$(PDF): $(TEX) $(BIB)
	pdflatex $(TEX)
	pdflatex $(TEX)

clean:
	rm -f *.aux *.log *.out *.pdf *.bbl *.blg *.toc *.lof *.lot

view: $(PDF)
	xdg-open $(PDF) 2>/dev/null || open $(PDF) 2>/dev/null || echo "Open $(PDF) manually"
