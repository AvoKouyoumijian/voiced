#include <stdio.h>
#include <spawn.h>

extern *enviorn;

int main(void)
{
    pid_t pid;

    char *data_argv[] = {"./voiced"};

    posix_spawn(&pid, "./voiced", NULL, NULL, data_argv, enviorn);
}