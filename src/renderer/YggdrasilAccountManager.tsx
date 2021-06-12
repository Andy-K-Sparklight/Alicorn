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
  FormControlLabel,
  IconButton,
  LinearProgress,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { useCardStyles, useInputStyles, usePadStyles } from "./Stylex";
import {
  AccountType,
  copyAccount,
  getAllAccounts,
  loadAccount,
  removeAccount,
  saveAccount,
} from "../modules/auth/AccountUtil";
import { Account } from "../modules/auth/Account";
import { tr } from "./Translator";
import { Add, DeleteForever, Refresh } from "@material-ui/icons";
import { ALICORN_ENCRYPTED_DATA_SUFFIX } from "../modules/commons/Constants";
import { YNDialog } from "./OperatingHint";
import { MojangAccount } from "../modules/auth/MojangAccount";
import { AuthlibAccount } from "../modules/auth/AuthlibAccount";
import { Nide8Account } from "../modules/auth/Nide8Account";

// This is only for Yggdrasil accounts
// MS Account and Local Account should not be saved

export function YggdrasilAccountManager(): JSX.Element {
  const classes = usePadStyles();
  const mountedBit = useRef<boolean>(true);
  const accountsLoaded = useRef<boolean>(false);
  const [accounts, setAccounts] = useState<Set<Account>>(new Set<Account>());
  const [isAdding, isAddingUpdate] = useState<boolean>(false);
  useEffect(() => {
    mountedBit.current = true;
    if (!accountsLoaded.current) {
      accountsLoaded.current = true;
      (async () => {
        const a = await getAllAccounts();
        const builtAccount: Set<Account> = new Set<Account>();
        for (const accountFile of a) {
          const r = await loadAccount(accountFile);
          if (r) {
            builtAccount.add(r);
          }
        }
        if (mountedBit.current) {
          setAccounts(builtAccount);
        }
      })();
    }

    return () => {
      mountedBit.current = false;
    };
  });

  return (
    <Box className={classes.para}>
      <Box style={{ textAlign: "right", marginRight: "18%" }}>
        <Tooltip title={tr("AccountManager.Reload")}>
          <IconButton
            color={"inherit"}
            onClick={() => {
              accountsLoaded.current = false;
              setAccounts(new Set<Account>());
            }}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
        <Tooltip title={tr("AccountManager.AddYggdrasil")}>
          <IconButton
            color={"inherit"}
            onClick={() => {
              isAddingUpdate(true);
            }}
          >
            <Add />
          </IconButton>
        </Tooltip>
      </Box>
      <AddAccountWrapper
        open={isAdding}
        onClose={() => {
          isAddingUpdate(false);
        }}
        handleNewAccount={(a) => {
          isAddingUpdate(false);
          const s1 = new Set(accounts.keys());
          s1.add(a);
          setAccounts(s1);
        }}
      />
      {(() => {
        const components: JSX.Element[] = [];
        for (const a of accounts) {
          components.push(
            <SingleAccountDisplay
              key={a.getAccountIdentifier()}
              account={a}
              updateAccount={(n) => {
                const aCopy = new Set(accounts.keys());
                aCopy.delete(a);
                aCopy.add(n);
                setAccounts(aCopy);
              }}
              deleteAccount={(c) => {
                const aCopy = new Set(accounts.keys());
                aCopy.delete(c);
                setAccounts(aCopy);
              }}
            />
          );
        }
        return components;
      })()}
    </Box>
  );
}

export function SingleAccountDisplay(props: {
  account: Account;
  updateAccount: (origin: Account, newAccount: Account) => unknown;
  deleteAccount: (origin: Account) => unknown;
}): JSX.Element {
  const accountCopy = copyAccount(props.account);
  const classes = useCardStyles();
  const [isOperating, setOperating] = useState<boolean>(false);
  const [mjLWOpening, setMjLWOpen] = useState<boolean>(false);
  const usingAccount = useRef<Account>(accountCopy);
  const [isAsking, isAskingUpdate] = useState<boolean>(false);
  return (
    <Box>
      {/* Confirm delete */}
      {isAsking ? (
        <YNDialog
          onClose={() => {
            isAskingUpdate(false);
          }}
          onAccept={async () => {
            isAskingUpdate(false);
            await removeAccount(
              usingAccount.current.getAccountIdentifier() +
                ALICORN_ENCRYPTED_DATA_SUFFIX
            );
            props.deleteAccount(props.account);
          }}
          title={tr("AccountManager.DeleteTitle")}
          content={tr("AccountManager.DeleteMsg")}
          yes={tr("AccountManager.Yes")}
          no={tr("AccountManager.No")}
        />
      ) : (
        ""
      )}
      {/* This is for Mojang */}
      <YggdrasilForm
        onClose={() => {
          setMjLWOpen(false);
          setOperating(false);
        }}
        open={mjLWOpening}
        account={usingAccount.current}
        updateAccount={async (a) => {
          setMjLWOpen(false);
          await saveAccount(a);
          usingAccount.current = a;
          props.updateAccount(props.account, a);
          setOperating(false);
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
                    isAskingUpdate(true);
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
                    const status = await usingAccount.current.flushToken();
                    if (status) {
                      await saveAccount(usingAccount.current);
                      setOperating(false);
                    } else {
                      setMjLWOpen(true);
                    }
                    props.updateAccount(props.account, usingAccount.current);
                  })();
                }}
              >
                <Refresh />
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

export function toReadableType(t: AccountType): string {
  switch (t) {
    case AccountType.NIDE8:
      return "Nide8";
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
  account: Account | undefined;
  updateAccount: (a: Account) => unknown;
}): JSX.Element {
  const classes = useInputStyles();
  const [pwd, setPwd] = useState<string>("");
  const [isRunning, isRunningUpdate] = useState<boolean>(false);
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
          color={"secondary"}
          disabled={isRunning}
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
          disabled={pwd.length === 0 || isRunning}
          onClick={() => {
            isRunningUpdate(true);
            (async () => {
              setError(false);
              const acc = copyAccount(props.account);
              if (await acc.performAuth(pwd)) {
                props.updateAccount(acc);
              } else {
                setError(true);
              }
              isRunningUpdate(false);
              setPwd("");
            })();
          }}
        >
          {tr("AccountManager.Validate")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Add Yggdrasil
// Need to be closed manually when handleNewAccount is called
function AddAccount(props: {
  open: boolean;
  onClose: () => unknown;
  handleNewAccount: (a: Account) => unknown;
}): JSX.Element {
  const [email, emailUpdate] = useState<string>("");
  const [authHost, authHostUpdate] = useState<string>("");
  const [isCustom, isCustomUpdate] = useState<boolean>(false);
  const [isNide, setNide] = useState<boolean>(false);
  const classes = useInputStyles();
  return (
    <Box>
      <Dialog
        open={props.open}
        onClose={() => {
          props.onClose();
          emailUpdate("");
        }}
      >
        <DialogContent>
          <DialogTitle>{tr("AccountManager.AddTitle")}</DialogTitle>
          <TextField
            autoFocus
            className={classes.input}
            margin={"dense"}
            color={"secondary"}
            onChange={(e) => {
              emailUpdate(e.target.value);
            }}
            label={tr("AccountManager.Email")}
            type={"email"}
            spellCheck={false}
            fullWidth
            variant={"outlined"}
          />
          <FormControlLabel
            control={
              <Switch
                checked={isCustom}
                onChange={(e) => {
                  isCustomUpdate(e.target.checked);
                  if (!e.target.checked) {
                    setNide(false);
                  }
                }}
              />
            }
            label={tr("AccountManager.UseCustomHost")}
          />
          <FormControlLabel
            control={
              <Switch
                disabled={!isCustom}
                checked={isCustom && isNide}
                onChange={(e) => {
                  setNide(e.target.checked);
                }}
              />
            }
            label={tr("AccountManager.UseNide8")}
          />
          <TextField
            disabled={!isCustom}
            className={classes.input}
            margin={"dense"}
            color={"secondary"}
            onChange={(e) => {
              authHostUpdate(e.target.value);
            }}
            label={tr("AccountManager.Host")}
            type={"url"}
            spellCheck={false}
            fullWidth
            variant={"outlined"}
          />
          {isCustom ? (
            <DialogContentText style={{ fontSize: "small", color: "#ff8400" }}>
              {tr("AccountManager.Warn")}
            </DialogContentText>
          ) : (
            ""
          )}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={
              email.length === 0 || (isCustom && authHost.trim().length === 0)
            }
            onClick={() => {
              if (isCustom) {
                if (isNide) {
                  props.handleNewAccount(new Nide8Account(email, authHost));
                } else {
                  props.handleNewAccount(
                    new AuthlibAccount(
                      email,
                      authHost.endsWith("/") ? authHost.slice(0, -1) : authHost
                    )
                  );
                }
              } else {
                props.handleNewAccount(new MojangAccount(email));
              }
            }}
          >
            {tr("AccountManager.Next")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function AddAccountWrapper(props: {
  open: boolean;
  onClose: () => unknown;
  handleNewAccount: (a: Account) => unknown;
}): JSX.Element {
  const [isPwdOpen, isPwdOpenUpdate] = useState<boolean>(false);
  const [isEmailOpen, isEmailOpenUpdate] = useState<boolean>(true);
  const [tmpAccount, tmpAccountUpdate] = useState<Account>();
  return (
    <Box>
      <YggdrasilForm
        onClose={() => {
          isPwdOpenUpdate(false);
          isEmailOpenUpdate(true);
        }}
        open={props.open && isPwdOpen}
        account={tmpAccount}
        updateAccount={async (a) => {
          tmpAccountUpdate(a);
          await saveAccount(a);
          isPwdOpenUpdate(false);
          props.onClose();
          isEmailOpenUpdate(true);
          props.handleNewAccount(a);
        }}
      />
      <AddAccount
        open={props.open && isEmailOpen}
        onClose={() => {
          isEmailOpenUpdate(true);
          isPwdOpenUpdate(false);
          props.onClose();
        }}
        handleNewAccount={(a) => {
          isEmailOpenUpdate(false);
          isPwdOpenUpdate(true);
          tmpAccountUpdate(a);
        }}
      />
    </Box>
  );
}
