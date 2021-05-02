import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  LinearProgress,
  TextField,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { useCardStyles, useInputStyles, usePadStyles } from "./Stylex";
import {
  AccountType,
  getAllAccounts,
  loadAccount,
  removeAccount,
} from "../modules/auth/AccountUtil";
import { Account } from "../modules/auth/Account";
import { tr } from "./Translator";
import { DeleteForever } from "@material-ui/icons";
import { ALICORN_ENCRYPTED_DATA_SUFFIX } from "../modules/commons/Constants";

// UNCHECKED

export function AccountManager(): JSX.Element {
  const classes = usePadStyles();
  const mountedBit = useRef<boolean>(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  useEffect(() => {
    mountedBit.current = true;
    (async () => {
      const a = await getAllAccounts();
      const builtAccount: Account[] = [];
      for (const accountFile of a) {
        const r = await loadAccount(accountFile);
        if (r) {
          builtAccount.push(r);
        }
      }
      if (mountedBit.current) {
        setAccounts(builtAccount);
      }
    })();
    return () => {
      mountedBit.current = false;
    };
  });

  return <Box className={classes.para}></Box>;
}

export function SingleAccountDisplay(props: {
  account: Account;
  updateAccount: (origin: Account, newAccount: Account) => unknown;
}): JSX.Element {
  const accountCopy = Object.assign({}, props.account);
  const classes = useCardStyles();
  const [isOperating, setOperating] = useState<boolean>(false);
  const [mjLWOpening, setMjLWOpen] = useState<boolean>(false);
  const usingAccount = useRef<Account>(accountCopy);
  return (
    <Box>
      {/* This is for Mojang */}
      <YggdrasilForm
        onClose={() => {
          setMjLWOpen(false);
        }}
        open={mjLWOpening}
        account={usingAccount.current}
        updateAccount={(a) => {
          setMjLWOpen(false);
          props.updateAccount(props.account, a);
        }}
      />
      <Card className={classes.card}>
        <CardContent>
          <Box>
            <Tooltip title={tr("AccountManager.Remove")}>
              <IconButton
                disabled={isOperating}
                color={"inherit"}
                className={classes.operateButton}
                onClick={() => {
                  (async () => {
                    await removeAccount(
                      usingAccount.current.getAccountIdentifier() +
                        ALICORN_ENCRYPTED_DATA_SUFFIX
                    );
                    props.updateAccount(props.account, usingAccount.current);
                  })();
                }}
              >
                <DeleteForever />
              </IconButton>
            </Tooltip>
            <Tooltip title={tr("AccountManager.Refresh")}>
              <IconButton
                disabled={isOperating}
                color={"inherit"}
                className={classes.operateButton}
                onClick={() => {
                  setOperating(true);
                  (async () => {
                    if (!(await usingAccount.current.isAccessTokenValid())) {
                      const status = await usingAccount.current.flushToken();
                      if (status) {
                        setOperating(false);
                      } else {
                        if (
                          usingAccount.current.type === AccountType.MICROSOFT ||
                          usingAccount.current.type === AccountType.ALICORN
                        ) {
                        } else {
                          setMjLWOpen(true);
                        }
                      }
                      props.updateAccount(props.account, usingAccount.current);
                    }
                  })();
                }}
              >
                <DeleteForever />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography
            className={classes.text}
            color={"textSecondary"}
            gutterBottom
          >
            {toReadableType(props.account.type)}
          </Typography>
          <Typography variant={"h6"} gutterBottom>
            {props.account.accountName}
          </Typography>
          <Typography
            className={classes.text}
            color={"textSecondary"}
            gutterBottom
          >
            {props.account.lastUsedUUID}
          </Typography>
          <LinearProgress
            color={"secondary"}
            style={isOperating ? {} : { display: "none" }}
          />
        </CardContent>
      </Card>
    </Box>
  );
}

function toReadableType(t: AccountType): string {
  switch (t) {
    case AccountType.ALICORN:
      return "Alicorn";
    case AccountType.AUTHLIB_INJECTOR:
      return "Authlib Injector";
    case AccountType.MICROSOFT:
      return "Microsoft";
    case AccountType.MOJANG:
    default:
      return "Mojang";
  }
}

// Method updateAccount will only be called if success
function YggdrasilForm(props: {
  onClose: () => unknown;
  open: boolean;
  account: Account;
  updateAccount: (a: Account) => unknown;
}): JSX.Element {
  const classes = useInputStyles();
  const [pwd, setPwd] = useState<string>("");
  const isRunning = useRef<boolean>(false);
  const [hasError, setError] = useState<boolean>(false);
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>{tr("AccountManager.EnterPassword")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {tr("AccountManager.EnterPasswordHint")}
        </DialogContentText>
        <TextField
          className={classes.input}
          autoFocus
          margin={"dense"}
          onChange={(e) => {
            setPwd(e.target.value);
          }}
          label={tr("AccountManager.Password")}
          type={"password"}
          spellCheck={false}
          disabled={isRunning.current}
          fullWidth
          variant={"outlined"}
          value={pwd}
        />
        {hasError ? (
          <DialogContentText style={{ fontSize: "small", color: "#ff8400" }}>
            {tr("AccountManager.Failed")}
          </DialogContentText>
        ) : (
          ""
        )}
      </DialogContent>
      <DialogActions>
        <Button
          disabled={pwd.length === 0 || isRunning.current}
          onClick={() => {
            (async () => {
              setError(false);
              const acc = Object.assign({}, props.account);
              if (await acc.performAuth(pwd)) {
                props.updateAccount(acc);
                isRunning.current = false;
                setPwd("");
              } else {
                setError(true);
              }
            })();
          }}
        >
          {tr("AccountManager.Validate")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
