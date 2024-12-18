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
    // set up spwan actions
    posix_spawn_file_actions_t espeak_actions, ffmpeg_actions;
    // set up pids for process
    pid_t espeak_pid, ffmpeg_pid;

    // set up espeak actions
    if (posix_spawn_file_actions_init(&espeak_actions) != 0)
    {
        perror("posix_spawn_file_actions_init");
    }
    // close unused read end of pipe in espeak
    if (posix_spawn_file_actions_addclose(&espeak_actions, fds_pipe[0]))
    {
        perror("posix_spawn_file_actions_addclose");
    }
    // make the stdout the write end of the pipe
    if (posix_spawn_file_actions_adddup2(&espeak_actions, fds_pipe[1], STDOUT_FILENO))
    {
        perror("posix_spawn_file_actions_adddup2");
    }

    // call espeak with actions
    char *espeak_argv[] = {"espeak-ng", "--stdin", "--stdout", NULL};
    int set_posix = posix_spawnp(&espeak_pid, "espeak", &espeak_actions, NULL, espeak_argv, environ);
    if (set_posix != 0)
    {
        errno = set_posix;
        perror("posix_spawn");
        exit(1);
    }

    // delete actions given to espeak
    posix_spawn_file_actions_destroy(&espeak_actions);

    // set up ffmpeg actions
    if (posix_spawn_file_actions_init(&ffmpeg_actions) != 0)
    {
        perror("posix_spawn_file_actions_init");
    }
    // close unused write end of pipe in ffmpeg
    if (posix_spawn_file_actions_addclose(&ffmpeg_actions, fds_pipe[1]))
    {
        perror("posix_spawn_file_actions_addclose");
    }
    // make the stdin of the process ffmpeg the read end of the pipe
    if (posix_spawn_file_actions_adddup2(&ffmpeg_actions, fds_pipe[0], STDIN_FILENO))
    {
        perror("posix_spawn_file_actions_adddup2");
    }

    // call ffmpeg with actions
    char *ffmpeg_argv[] = {
        "ffmpeg",
        "-loglevel", "error",
        "-i", "pipe:0", // Read input from read end of pipe
        "-f", "mp3",    // set output format to MP3
        "pipe:1",       // output to stdout (file des 1 = stdout)
        NULL};
    set_posix = posix_spawnp(&ffmpeg_pid, "ffmpeg", &ffmpeg_actions, NULL, ffmpeg_argv, environ);
    if (set_posix != 0)
    {
        perror("posix_spawn for ffmpeg failed");
        exit(2);
    }

    // delete actions given to ffmpeg
    posix_spawn_file_actions_destroy(&ffmpeg_actions);

    // wait for espeak to finish
    if (waitpid(espeak_pid, NULL, 0) == -1)
    {
        perror("waitpid for espeak failed");
        exit(3);
    }
    // close write end of pipe
    close(fds_pipe[1]);

    // wait for ffmpeg to finish
    if (waitpid(ffmpeg_pid, NULL, 0) == -1)
    {
        perror("waitpid for ffmpeg failed");
        exit(4);
    }

    // close read end of pipe
    close(fds_pipe[0]);

    return 0;
}
