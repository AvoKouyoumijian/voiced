# Compiler and flags
CC = gcc
CFLAGS = -Wall -Wextra -std=c11
LDFLAGS = -lespeak

# Target executable
TARGET = my_program
SRC = my_program.c

# Default build rule
all: $(TARGET)

$(TARGET): $(SRC)
	$(CC) $(CFLAGS) $(SRC) -o $(TARGET) $(LDFLAGS)

# Clean up generated files
clean:
	rm -f $(TARGET)
