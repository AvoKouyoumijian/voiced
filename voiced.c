#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <assert.h>
#include <spawn.h>
#include <fcntl.h>

#include <unistd.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <sys/types.h>

#include <errno.h>

// export enviornment
extern char **environ;

char *file_command_path(char *command);
bool is_executable(const char *pathname);

int main(int argc, char *argv[])
{
    // make a pipe
    int fds_pipe[2];
    if (pipe(fds_pipe) != 0)
    {
        perror("pipe");
    }
    posix_spawn_file_actions_t espeak_actions, ffmpeg_actions;

    if (posix_spawn_file_actions_init(&espeak_actions) != 0)
    {
        perror("posix_spawn_file_actions_init");
    }
    if (posix_spawn_file_actions_addclose(&espeak_actions, fds_pipe[0]))
    {
        perror("posix_spawn_file_actions_addclose");
    }

    if (posix_spawn_file_actions_adddup2(&espeak_actions, fds_pipe[1], STDOUT_FILENO))
    {
        perror("posix_spawn_file_actions_adddup2");
    }

    char *data_argv[] = {"espeak", "--stdin", "--stdout", NULL};
    pid_t espeak_pid, ffmpeg_pid;

    int set_posix = posix_spawnp(&espeak_pid, "espeak", NULL, NULL, data_argv, environ);
    if (set_posix != 0)
    {
        errno = set_posix;
        perror("posix_spawn");
        exit(1);
    }

    // wait for espeak to finish
    if (waitpid(espeak_pid, NULL, 0) == -1)
    {
        perror("waitpid failed");
        exit(1);
    }

    // ffmpeg

    posix_spawn_file_actions_destroy(&ffmpeg_actions);

    if (posix_spawn_file_actions_init(&ffmpeg_actions) != 0)
    {
        perror("posix_spawn_file_actions_init");
    }
    if (posix_spawn_file_actions_addclose(&ffmpeg_actions, fds_pipe[1]))
    {
        perror("posix_spawn_file_actions_addclose");
    }
    if (posix_spawn_file_actions_adddup2(&ffmpeg_actions, fds_pipe[0], STDIN_FILENO))
    {
        perror("posix_spawn_file_actions_adddup2");
    }

    // Spawn ffmpeg process
    char *ffmpeg_argv[] = {
        "ffmpeg",
        "-i", "pipe:0", // Read input from pipe
        "-f", "mp3",    // Set output format to MP3
        "pipe:1",       // Output to stdout (file des 1 = stdout)
        NULL};

    if (posix_spawnp(&ffmpeg_pid, "ffmpeg", &ffmpeg_actions, NULL, ffmpeg_argv, environ) != 0)
    {
        perror("posix_spawn for ffmpeg failed");
        exit(EXIT_FAILURE);
    }

    // wait for ffmpeg to finish
    if (waitpid(ffmpeg_pid, NULL, 0) == -1)
    {
        perror("waitpid for ffmpeg failed");
        exit(1);
    }

    return 0;
}

//
// finds a executable command in PATH given a reletvie command
//
char *file_command_path(char *command)
{
    // get path from env
    char *path = getenv("PATH");

    // search for a executable path
    char *path_dir = strtok(path, ":");
    while (path_dir)
    {
        size_t path_len = strlen(path_dir) + strlen(command) + 2;
        char *command_path = malloc(path_len);
        snprintf(command_path, path_len, "%s/%s", path_dir, command);

        // return if the command_path is_executable
        if (is_executable(command_path))
        {
            return strdup(command_path);
        }

        // free the made command path
        free(command_path);
        path_dir = strtok(NULL, ":");
    }
    // return NULL if commmand cannot be executed
    free(path);
    return NULL;
}

//
// Check whether this process can execute a certain file.
// Useful for checking whether a command is in the PATH.
//
bool is_executable(const char *pathname)
{
    struct stat s;
    return
        // does the file exist?
        stat(pathname, &s) == 0 &&
        // is the file a regular file?
        S_ISREG(s.st_mode) &&
        // can we execute it?
        access(pathname, X_OK) == 0;
}
